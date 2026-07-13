import crypto from "node:crypto";
import {
  appendAuditLog,
  appendNewsJob,
  appendNewsPublicationAudit,
  getCmsItems,
  getNewsJobs,
  getNewsPublicationAudits,
  getNewsSources,
  getPublishedNewsCountForDate,
  saveCmsItem,
  slugify
} from "@/lib/cmsStore";
import { acquirePersistentLock, hasPersistentStore, releasePersistentLock } from "@/lib/persistentStore";
import { refreshSitemap } from "@/lib/sitemapService";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.cowinsupply.com").replace(/\/$/, "");
const DEFAULT_TIMEZONE = process.env.NEWS_TIMEZONE || "Asia/Shanghai";
const NEWS_STATUSES = ["discovered", "fetched", "rejected", "duplicate", "analyzing", "draft", "review_required", "scheduled", "publishing", "published", "failed", "archived"];

export function getNewsAutomationConfig() {
  return {
    dailyTarget: numberEnv("NEWS_DAILY_TARGET", 4),
    timezone: DEFAULT_TIMEZONE,
    maxRetries: numberEnv("NEWS_MAX_RETRIES", 2),
    lookbackHours: numberEnv("NEWS_LOOKBACK_HOURS", 72),
    dedupDays: numberEnv("NEWS_DEDUP_DAYS", 7),
    relevanceThreshold: Math.max(numberEnv("NEWS_RELEVANCE_THRESHOLD", 18), 18),
    autoPublish: String(process.env.NEWS_AUTO_PUBLISH || "true").toLowerCase() !== "false",
    allowedLanguages: String(process.env.NEWS_ALLOWED_LANGUAGES || "en,zh")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    sourceWhitelist: stringListEnv("NEWS_SOURCE_WHITELIST"),
    sourceBlacklist: stringListEnv("NEWS_SOURCE_BLACKLIST")
  };
}

export async function runNewsAutomation({ trigger = "manual", dryRun = false } = {}) {
  if (process.env.VERCEL && !hasPersistentStore()) {
    throw new Error("News automation requires DATABASE_URL or POSTGRES_URL in production.");
  }
  const lock = await acquirePersistentLock("news_auto_publish");
  if (hasPersistentStore() && !lock) {
    return finishJob({
      trigger,
      startedAt: new Date().toISOString(),
      status: "skipped",
      errorMessage: "Another News automation run is still active.",
      metadata: { reason: "concurrency_lock" }
    });
  }
  try {
    return await runNewsAutomationUnlocked({ trigger, dryRun });
  } finally {
    await releasePersistentLock(lock);
  }
}

async function runNewsAutomationUnlocked({ trigger, dryRun }) {
  const config = getNewsAutomationConfig();
  const startedAt = new Date().toISOString();
  const today = dateKeyInTimezone(new Date(), config.timezone);
  const currentCount = await getPublishedNewsCountForDate(today, config.timezone);
  const missing = Math.max(0, config.dailyTarget - currentCount);

  if (!missing) {
    await appendNewsPublicationAudit({
      date: today,
      timezone: config.timezone,
      targetCount: config.dailyTarget,
      publishedCount: currentCount,
      missingCount: 0,
      status: "complete",
      message: "Daily News target already met."
    });
    return finishJob({ trigger, startedAt, status: "success", metadata: { currentCount, missing: 0 } });
  }

  const sources = (await getNewsSources()).filter((source) => sourceIsAllowed(source, config));
  if (!sources.length) {
    await appendNewsPublicationAudit({
      date: today,
      timezone: config.timezone,
      targetCount: config.dailyTarget,
      publishedCount: currentCount,
      missingCount: missing,
      status: "blocked",
      message: "NEWS_SOURCE_FEEDS is not configured; no article was fabricated."
    });
    return finishJob({
      trigger,
      startedAt,
      status: "failed",
      errorMessage: "No News RSS sources configured.",
      metadata: { currentCount, missing, requiredEnv: "NEWS_SOURCE_FEEDS" }
    });
  }

  const [products, existingNews] = await Promise.all([getCmsItems("product"), getCmsItems("news", { includeInactive: true })]);
  const candidates = [];
  const sourceResults = [];

  for (const source of sources) {
    const fetched = await fetchSourceCandidates(source, config);
    sourceResults.push({ source: source.publisherName || source.domain, ...fetched.summary });
    candidates.push(...fetched.items);
  }

  const selected = [];
  const rejections = [];
  for (const candidate of candidates) {
    const prepared = prepareCandidate(candidate, products, existingNews, config);
    if (!prepared.ok) {
      rejections.push(prepared.reason);
      continue;
    }
    selected.push(prepared.article);
    if (selected.length >= missing) break;
  }

  const published = [];
  if (!dryRun) {
    for (const article of selected) {
      const saved = await saveCmsItem(article);
      published.push(saved);
      existingNews.push(saved);
      await appendAuditLog({ actor: "news-automation", action: "publish", module: "news", target: saved.slug, result: "success" });
    }
    if (published.length) {
      await refreshSitemap({ trigger: "news_auto_publish", submit: false });
    }
  }

  const finalCount = currentCount + published.length;
  await appendNewsPublicationAudit({
    date: today,
    timezone: config.timezone,
    targetCount: config.dailyTarget,
    publishedCount: finalCount,
    missingCount: Math.max(0, config.dailyTarget - finalCount),
    status: finalCount >= config.dailyTarget ? "complete" : "shortfall",
    message: finalCount >= config.dailyTarget ? "Daily News target met." : "Not enough valid, recent, product-related source items were available."
  });

  return finishJob({
    trigger,
    startedAt,
    status: finalCount >= config.dailyTarget ? "success" : "failed",
    errorMessage: finalCount >= config.dailyTarget ? "" : "Daily target shortfall.",
    metadata: {
      currentCount,
      missing,
      sources: sourceResults,
      candidates: candidates.length,
      rejected: rejections.length,
      published: published.length,
      dryRun
    }
  });
}

export async function getNewsAutomationDashboard() {
  const [sources, jobs, audits, news] = await Promise.all([
    getNewsSources({ includeDisabled: true }),
    getNewsJobs(),
    getNewsPublicationAudits(),
    getCmsItems("news", { includeInactive: true })
  ]);
  const published = news.filter((item) => item.status === "published");
  return {
    config: getNewsAutomationConfig(),
    statuses: NEWS_STATUSES,
    sources,
    jobs: jobs.slice(0, 50),
    audits: audits.slice(0, 50),
    latestPublished: published.slice(0, 20),
    todayCount: await getPublishedNewsCountForDate(dateKeyInTimezone(new Date(), DEFAULT_TIMEZONE), DEFAULT_TIMEZONE)
  };
}

export function buildNewsStructuredData(article, products = []) {
  const url = `${SITE_URL}/news/${article.slug}`;
  const image = absoluteUrl(article.image || `/api/news/cover/${article.slug}`);
  return [
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: article.title,
      description: article.seoDescription || article.summary,
      image,
      datePublished: article.publishedAt || article.createdAt,
      dateModified: article.updatedAt || article.publishedAt || article.createdAt,
      author: { "@type": "Organization", name: article.authorName || "Cowin Supply Editorial" },
      publisher: {
        "@type": "Organization",
        name: "Cowin Supply",
        logo: { "@type": "ImageObject", url: `${SITE_URL}/cowin-assets/logo.png` }
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      articleSection: article.category || "Industry News",
      keywords: [article.primaryKeyword, ...(article.secondaryKeywords || [])].filter(Boolean).join(", "),
      about: (article.relatedProducts || []).map((item) => item.productTitle || item.title),
      // Related items are contextual references in an editorial article, not price-backed product offers.
      mentions: products.map((item) => ({ "@type": "Thing", name: item.title, url: `${SITE_URL}/product/${item.slug}.html` }))
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "News", item: `${SITE_URL}/news` },
        { "@type": "ListItem", position: 3, name: article.title, item: url }
      ]
    }
  ];
}

async function fetchSourceCandidates(source, config) {
  const summary = { fetched: 0, accepted: 0, rejected: 0, error: "" };
  try {
    const rssUrl = source.rssUrl || source.rss_url;
    const response = await safeFetch(rssUrl);
    if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
    const xml = await response.text();
    const items = parseRssItems(xml)
      .map((item) => normalizeRssItem(item, source))
      .filter((item) => {
        summary.fetched += 1;
        const ok = isRecent(item.sourcePublishedAt, config.lookbackHours);
        summary[ok ? "accepted" : "rejected"] += 1;
        return ok;
      });
    return { items, summary };
  } catch (error) {
    summary.error = error.message;
    return { items: [], summary };
  }
}

function prepareCandidate(candidate, products, existingNews, config) {
  if (!candidate.sourcePublishedAt) return { ok: false, reason: "missing_source_published_at" };
  if (!config.allowedLanguages.includes(candidate.sourceLanguage)) return { ok: false, reason: "unsupported_source_language" };
  if (isDuplicate(candidate, existingNews, config.dedupDays)) return { ok: false, reason: "duplicate_within_dedup_window" };

  const relatedProducts = scoreProducts(candidate, products)
    .filter((item) => item.matchedTerms.length && item.relevanceScore >= config.relevanceThreshold)
    .slice(0, 3);
  if (!relatedProducts.length) return { ok: false, reason: "insufficient_product_relevance" };

  const primaryProduct = relatedProducts[0];
  const baseSlug = slugify(`${candidate.title}-${candidate.sourcePublisher}`);
  const slug = uniqueSlug(baseSlug, existingNews);
  const publishedAt = new Date().toISOString();
  const summary = textOnly(candidate.summary || candidate.title).slice(0, 260);
  const cover = candidate.imageUrl || `/api/news/cover/${slug}`;

  return {
    ok: true,
    article: {
      type: "news",
      slug,
      title: rewriteTitle(candidate.title, primaryProduct.productTitle),
      category: "Industry News",
      image: cover,
      summary,
      status: config.autoPublish ? "published" : "review_required",
      language: candidate.sourceLanguage || "en",
      content: buildArticleContent(candidate, relatedProducts),
      authorName: "Cowin Supply Editorial",
      publishedAt: config.autoPublish ? publishedAt : "",
      updatedAt: publishedAt,
      seoTitle: `${rewriteTitle(candidate.title, primaryProduct.productTitle)} | Cowin Supply News`,
      seoDescription: summary,
      canonicalUrl: `${SITE_URL}/news/${slug}`,
      primaryKeyword: primaryProduct.productTitle,
      secondaryKeywords: relatedProducts.map((item) => item.productCategory).filter(Boolean),
      geoSummary: `${summary} Cowin Supply analysis connects this source item with ${relatedProducts.map((item) => item.productTitle).join(", ")}.`,
      keyTakeaways: [
        "The source item was published within the configured 72-hour collection window.",
        `The topic is linked to ${primaryProduct.productTitle} and related B2B procurement needs.`,
        "Cowin Supply adds independent product and supply-chain context instead of republishing the original article."
      ],
      sourceTitle: candidate.sourceTitle,
      sourceAuthor: candidate.sourceAuthor,
      sourcePublisher: candidate.sourcePublisher,
      sourceUrl: candidate.sourceUrl,
      canonicalSourceUrl: candidate.canonicalSourceUrl,
      sourceLanguage: candidate.sourceLanguage,
      sourcePublishedAt: candidate.sourcePublishedAt,
      sourceFetchedAt: candidate.sourceFetchedAt,
      sourceTimezone: "UTC",
      sourceFingerprint: candidate.sourceFingerprint,
      eventFingerprint: candidate.eventFingerprint,
      contentHash: sha256(`${candidate.title}|${summary}`),
      relevanceScore: primaryProduct.relevanceScore,
      credibilityScore: candidate.credibilityScore,
      relatedProducts,
      originalFacts: `The source item titled "${candidate.sourceTitle}" was published by ${candidate.sourcePublisher} on ${candidate.sourcePublishedAt}.`,
      ourAnalysis: `Cowin Supply views this update as relevant to professional buyers evaluating ${primaryProduct.productTitle} and adjacent power-tool categories.`,
      customerImpact: "B2B buyers can use the update as a signal to review tool selection, application fit, replacement planning and supplier readiness.",
      ourHelp: `Cowin Supply can help buyers compare suitable products such as ${relatedProducts.map((item) => item.productTitle).join(", ")} and request sourcing support.`,
      faq: [
        { question: "What source is this article based on?", answer: `${candidate.sourcePublisher}: ${candidate.sourceTitle}` },
        { question: "Which Cowin Supply products are related?", answer: relatedProducts.map((item) => item.productTitle).join(", ") }
      ],
      coverImageSourceUrl: candidate.imageUrl ? candidate.imageUrl : `${SITE_URL}/api/news/cover/${slug}`,
      coverImagePageUrl: candidate.sourceUrl,
      coverImageAlt: `${primaryProduct.productTitle} industry news illustration`,
      coverImageStatus: candidate.imageUrl ? "source" : "generated"
    }
  };
}

function buildArticleContent(candidate, relatedProducts) {
  const productLinks = relatedProducts.map((item) => `<a href="/product/${item.productSlug}.html">${escapeHtml(item.productTitle)}</a>`).join(", ");
  return [
    `<p><strong>Core conclusion:</strong> ${escapeHtml(textOnly(candidate.summary || candidate.title))}</p>`,
    "<h2>Original source facts</h2>",
    `<p>${escapeHtml(candidate.sourcePublisher)} published "${escapeHtml(candidate.sourceTitle)}" on ${escapeHtml(candidate.sourcePublishedAt)}. Cowin Supply uses the public source as a factual basis and does not republish the original full article.</p>`,
    "<h2>Why it matters</h2>",
    `<p>The update is relevant to B2B buyers watching power tools, construction workflow, workshop productivity and industrial supply planning.</p>`,
    "<h2>Cowin Supply view</h2>",
    `<p>Our view is that buyers should connect this signal with product availability, jobsite durability, after-sales expectations and category fit before making sourcing decisions.</p>`,
    "<h2>How Cowin Supply can help</h2>",
    `<p>Related Cowin Supply products include ${productLinks}. Customers can review these product pages or contact our team for application-specific sourcing support.</p>`,
    "<h2>Source note</h2>",
    `<p>This article is based on publicly available source information for summary and independent analysis. Original reporting copyright belongs to the original publisher.</p>`
  ].join("\n");
}

function parseRssItems(xml) {
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  return blocks.slice(0, 30).map((block) => ({
    title: tagValue(block, "title"),
    link: tagValue(block, "link") || attrValue(block, "link", "href"),
    description: tagValue(block, "description") || tagValue(block, "summary") || tagValue(block, "content:encoded"),
    pubDate: tagValue(block, "pubDate") || tagValue(block, "published") || tagValue(block, "updated"),
    author: tagValue(block, "author") || tagValue(block, "dc:creator"),
    image: attrValue(block, "media:thumbnail", "url") || attrValue(block, "media:content", "url") || attrValue(block, "enclosure", "url")
  }));
}

function normalizeRssItem(item, source) {
  const canonicalSourceUrl = canonicalizeUrl(item.link);
  const title = textOnly(item.title);
  const published = normalizeDate(item.pubDate);
  return {
    title,
    summary: textOnly(item.description),
    imageUrl: validExternalImage(item.image) ? item.image : "",
    sourceTitle: title,
    sourceAuthor: textOnly(item.author),
    sourcePublisher: source.publisherName || source.publisher_name || source.domain,
    sourceUrl: item.link,
    canonicalSourceUrl,
    sourceLanguage: source.language || "en",
    sourcePublishedAt: published,
    sourceFetchedAt: new Date().toISOString(),
    sourceFingerprint: sha256(`${source.domain}|${canonicalSourceUrl}|${title}`),
    eventFingerprint: sha256(`${normalizeTitle(title)}|${published?.slice(0, 10)}`),
    credibilityScore: Number(source.credibilityScore || source.credibility_score || 70)
  };
}

function scoreProducts(candidate, products) {
  const text = `${candidate.title} ${candidate.summary}`.toLowerCase();
  return products
    .map((product) => {
      const terms = productSignalTerms(product);
      const matchedTerms = terms.filter((term) => text.includes(term));
      let score = 0;
      for (const term of matchedTerms) {
        score += term.includes(" ") || term.length > 8 ? 18 : 12;
      }
      return {
        productId: product.id,
        productSlug: product.slug,
        productTitle: product.title,
        productCategory: product.category || "Products",
        productImage: product.image,
        productSummary: product.summary,
        relevanceScore: score,
        matchedTerms,
        relationshipReason: matchedTerms.length
          ? `Matched verified product terms: ${matchedTerms.join(", ")}.`
          : "No verified product-specific term was present in the source item.",
        displayOrder: 0
      };
    })
    .filter((item) => item.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .map((item, index) => ({ ...item, displayOrder: index + 1 }));
}

function productSignalTerms(product) {
  const genericTerms = new Set([
    "and", "best", "china", "construction", "daily", "durable", "electric", "for", "heavy", "high", "industrial", "machine", "machines",
    "manufacture", "performance", "power", "precision", "professional", "product", "products", "quality", "repair", "sales", "supply",
    "tool", "tools", "with"
  ]);
  const raw = [product.title, ...(product.tags || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/&amp;/g, " ");
  const phrases = raw
    .split(/[,|/]+/)
    .map((value) => value.replace(/[^a-z0-9]+/g, " ").trim())
    .filter((value) => value.length >= 5 && value.split(" ").some((word) => !genericTerms.has(word)));
  const words = raw
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4 && !genericTerms.has(word));
  return [...new Set([...phrases, ...words])].sort((a, b) => b.length - a.length).slice(0, 24);
}

function isDuplicate(candidate, existingNews, dedupDays) {
  const threshold = Date.now() - dedupDays * 24 * 60 * 60 * 1000;
  return existingNews.some((item) => {
    const usedAt = new Date(item.publishedAt || item.updatedAt || item.createdAt || 0).getTime();
    if (usedAt < threshold) return false;
    return (
      item.canonicalSourceUrl === candidate.canonicalSourceUrl ||
      item.sourceFingerprint === candidate.sourceFingerprint ||
      item.eventFingerprint === candidate.eventFingerprint ||
      normalizeTitle(item.sourceTitle || item.title) === normalizeTitle(candidate.sourceTitle)
    );
  });
}

function uniqueSlug(baseSlug, existingNews) {
  const taken = new Set(existingNews.map((item) => item.slug));
  let slug = baseSlug || `news-${Date.now()}`;
  let index = 2;
  while (taken.has(slug)) {
    slug = `${baseSlug}-${index}`;
    index += 1;
  }
  return slug;
}

async function finishJob({ trigger, startedAt, status, errorMessage = "", metadata = {} }) {
  return appendNewsJob({
    jobType: "news_auto_publish",
    status,
    startedAt,
    completedAt: new Date().toISOString(),
    retryCount: 0,
    errorMessage,
    metadata: { trigger, ...metadata }
  });
}

async function safeFetch(url) {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Invalid source protocol");
  if (/^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.)/.test(parsed.hostname)) throw new Error("Blocked private source host");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    return await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: { "user-agent": "CowinSupplyNewsBot/1.0 (+https://www.cowinsupply.com)" }
    });
  } finally {
    clearTimeout(timeout);
  }
}

function tagValue(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeEntities(stripCdata(match?.[1] || ""));
}

function attrValue(block, tag, attr) {
  const match = block.match(new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["'][^>]*>`, "i"));
  return decodeEntities(match?.[1] || "");
}

function stripCdata(value) {
  return String(value).replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
}

function decodeEntities(value) {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function textOnly(value) {
  return decodeEntities(String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function isRecent(value, hours) {
  const time = new Date(value).getTime();
  if (!time) return false;
  return Date.now() - time <= hours * 60 * 60 * 1000 && time <= Date.now() + 5 * 60 * 1000;
}

function canonicalizeUrl(value) {
  try {
    const url = new URL(value);
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"].forEach((key) => url.searchParams.delete(key));
    url.hash = "";
    return url.toString();
  } catch {
    return String(value || "");
  }
}

function validExternalImage(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function absoluteUrl(value) {
  try {
    return new URL(value, SITE_URL).toString();
  } catch {
    return `${SITE_URL}/api/news/cover/default`;
  }
}

function normalizeTitle(value) {
  return textOnly(value).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, " ").trim();
}

function rewriteTitle(title, productTitle) {
  const clean = textOnly(title).replace(/\s+/g, " ").slice(0, 92);
  return clean.toLowerCase().includes(String(productTitle).toLowerCase()) ? clean : `${clean}: What it means for ${productTitle}`;
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function numberEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function stringListEnv(name) {
  return String(process.env[name] || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function sourceIsAllowed(source, config) {
  const domain = String(source.domain || "").toLowerCase().replace(/^www\./, "");
  if (!domain || config.sourceBlacklist.includes(domain)) return false;
  return !config.sourceWhitelist.length || config.sourceWhitelist.includes(domain);
}

function dateKeyInTimezone(value, timezone) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}
