import crypto from "node:crypto";
import { appendAuditLog, getCmsItems, saveCmsItem, slugify, updateCmsItemStatus } from "@/lib/cmsStore";
import { refreshSitemap } from "@/lib/sitemapService";
import { acquirePersistentLock, getPersistentValue, hasPersistentStore, releasePersistentLock, setPersistentValue } from "@/lib/persistentStore";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.cowinsupply.com").replace(/\/$/, "");
const CONFIG_KEY = "news-automation-v2-config";
const CANDIDATES_KEY = "news-automation-v2-candidates";
const RUNS_KEY = "news-automation-v2-runs";
const STATE_KEY = "news-automation-v2-state";
const MIGRATION_KEY = "news-automation-v2-migration";
const LOCK_NAME = "cowinsupply-news-automation-v2";
const MAX_LOGS = 200;
const MAX_CANDIDATES = 300;

export const NEWS_WORKFLOW_STATUSES = ["discovered", "fetched", "verified", "planned", "generated", "quality_checked", "scheduled", "publishing", "published", "needs_review", "failed", "archived"];

const DEFAULT_SOURCES = [{
  id: "construction-dive",
  publisher: "Construction Dive",
  rssUrl: "https://www.constructiondive.com/feeds/news/",
  type: "industry_media",
  trustLevel: "high",
  language: "en",
  enabled: true,
  licenseNote: "Source text is used only for factual verification and linked attribution. No external editorial image is copied."
}];

const DEFAULT_CONFIG = {
  enabled: process.env.NEWS_AUTOMATION_ENABLED !== "false",
  timezone: process.env.NEWS_AUTOMATION_TIMEZONE || "Asia/Shanghai",
  publishIntervalHours: 48,
  maxPublishPerRun: 1,
  lookbackDays: 90,
  sourceWhitelist: DEFAULT_SOURCES,
  sourceBlacklist: [],
  productCombinationCooldownDays: 30,
  titleSimilarityThreshold: 0.78,
  contentSimilarityThreshold: 0.72,
  scheduleHour: 10,
  version: "v2"
};

export function getDefaultNewsAutomationConfig() {
  return structuredClone(DEFAULT_CONFIG);
}

export async function getNewsAutomationDashboard() {
  await migrateLegacyRules();
  const [config, candidates, runs, state, news] = await Promise.all([
    getConfig(), getValue(CANDIDATES_KEY, []), getValue(RUNS_KEY, []), getValue(STATE_KEY, defaultState()), getCmsItems("news", { includeInactive: true })
  ]);
  const published = news.filter((item) => item.status === "published");
  return {
    config,
    state,
    statuses: NEWS_WORKFLOW_STATUSES,
    candidates: candidates.slice(0, 80),
    runs: runs.slice(0, 50),
    published: published.filter((item) => item.automationVersion === "v2").slice(0, 30),
    metrics: {
      totalCandidates: candidates.length,
      needsReview: candidates.filter((item) => item.status === "needs_review").length,
      duplicateBlocked: candidates.filter((item) => item.rejectionReasons?.some((reason) => reason.includes("duplicate"))).length,
      publishedByV2: published.filter((item) => item.automationVersion === "v2").length,
      lastSuccessfulPublishAt: state.lastSuccessfulPublishAt || ""
    }
  };
}

export async function runNewsAutomation({ trigger = "manual", dryRun = false } = {}) {
  if (process.env.VERCEL && !hasPersistentStore()) {
    throw new Error("News automation requires DATABASE_URL or POSTGRES_URL in production.");
  }
  await migrateLegacyRules();
  const lock = await acquirePersistentLock(LOCK_NAME, 20 * 60 * 1000);
  if (hasPersistentStore() && !lock) return recordRun({ trigger, dryRun, status: "skipped", reason: "concurrency_lock" });
  try {
    return await runUnlocked({ trigger, dryRun });
  } finally {
    await releasePersistentLock(lock);
  }
}

export async function updateNewsAutomationConfig(input = {}) {
  const current = await getConfig();
  const next = {
    ...current,
    enabled: input.enabled ?? current.enabled,
    timezone: safeTimezone(input.timezone || current.timezone),
    scheduleHour: clampNumber(input.scheduleHour, 0, 23, current.scheduleHour),
    publishIntervalHours: Math.max(48, clampNumber(input.publishIntervalHours, 48, 720, current.publishIntervalHours)),
    sourceWhitelist: Array.isArray(input.sourceWhitelist) ? input.sourceWhitelist : current.sourceWhitelist,
    sourceBlacklist: Array.isArray(input.sourceBlacklist) ? input.sourceBlacklist : current.sourceBlacklist,
    updatedAt: new Date().toISOString(),
    updatedBy: input.updatedBy || "admin"
  };
  await setValue(CONFIG_KEY, next);
  return next;
}

export async function withdrawNewsArticle(slug, actor = "admin") {
  const items = await getCmsItems("news", { includeInactive: true });
  const item = items.find((entry) => entry.slug === slug && entry.automationVersion === "v2");
  if (!item) throw new Error("Automated News article not found.");
  await updateCmsItemStatus("news", slug, "offline");
  await appendAuditLog({ actor, action: "withdraw-auto-news", module: "news", target: slug });
  await refreshSitemap({ trigger: "news_v2_withdraw", submit: false });
  return { slug, status: "offline" };
}

export async function archiveCandidate(id, actor = "admin") {
  const candidates = await getValue(CANDIDATES_KEY, []);
  const next = candidates.map((item) => item.id === id ? { ...item, status: "archived", archivedAt: new Date().toISOString(), archivedBy: actor } : item);
  await setValue(CANDIDATES_KEY, next);
  return next.find((item) => item.id === id) || null;
}

async function runUnlocked({ trigger, dryRun }) {
  const startedAt = new Date().toISOString();
  const config = await getConfig();
  if (!config.enabled) return recordRun({ trigger, dryRun, status: "skipped", reason: "automation_disabled", startedAt });
  const [products, existingNews, candidates, state] = await Promise.all([
    getCmsItems("product"), getCmsItems("news", { includeInactive: true }), getValue(CANDIDATES_KEY, []), getValue(STATE_KEY, defaultState())
  ]);

  const sourceResults = [];
  const discovered = [];
  for (const source of config.sourceWhitelist.filter((item) => item.enabled !== false && !config.sourceBlacklist.includes(item.id))) {
    const fetched = await fetchSource(source);
    sourceResults.push(fetched.summary);
    discovered.push(...fetched.items);
  }

  const nextCandidates = [...candidates];
  const created = [];
  for (const raw of discovered) {
    const candidate = prepareCandidate(raw, { products, existingNews, candidates: nextCandidates, config });
    if (nextCandidates.some((item) => item.sourceFingerprint === candidate.sourceFingerprint)) continue;
    nextCandidates.unshift(candidate);
    created.push(candidate);
  }

  const eligible = nextCandidates.find((item) => item.status === "scheduled" && canPublish(state, item, config));
  let publishResult = { published: false, reason: eligible ? "dry-run" : nextPublishReason(state, config) };
  if (eligible && !dryRun) {
    const publishIndex = nextCandidates.findIndex((item) => item.id === eligible.id);
    nextCandidates[publishIndex] = { ...eligible, status: "publishing", publishingAt: new Date().toISOString() };
    await setValue(CANDIDATES_KEY, nextCandidates.slice(0, MAX_CANDIDATES));
    try {
      const article = buildPublishedArticle(eligible, [...existingNews, ...products]);
      const saved = await saveCmsItem(article);
      const sitemap = await refreshSitemap({ trigger: "news_v2_publish", submit: true });
      const google = sitemap.gscSubmit || {};
      await saveCmsItem({ ...article, googleSubmission: { attemptedAt: new Date().toISOString(), ...google, indexingStatus: "not-confirmed" } });
      const publishedCandidate = {
        ...eligible,
        status: "published",
        publishedAt: saved.publishedAt,
        articleSlug: saved.slug,
        googleSubmission: { attemptedAt: new Date().toISOString(), ...google, indexingStatus: "not-confirmed" }
      };
      nextCandidates[publishIndex] = publishedCandidate;
      await setValue(STATE_KEY, { ...state, lastSuccessfulPublishAt: saved.publishedAt, lastPublishedSlug: saved.slug, updatedAt: new Date().toISOString() });
      await appendAuditLog({ actor: "news-automation-v2", action: "publish", module: "news", target: saved.slug, result: "success" });
      publishResult = { published: true, slug: saved.slug, sitemap, googleSubmission: publishedCandidate.googleSubmission };
    } catch (error) {
      nextCandidates[publishIndex] = { ...eligible, status: "failed", failedAt: new Date().toISOString(), rejectionReasons: [sanitizeError(error)] };
      publishResult = { published: false, reason: "publish_failed", error: sanitizeError(error) };
    }
  }
  if (!dryRun) await setValue(CANDIDATES_KEY, nextCandidates.slice(0, MAX_CANDIDATES));
  return recordRun({ trigger, dryRun, status: publishResult.published ? "published" : "completed", startedAt, sourceResults, discovered: discovered.length, created: created.length, quality: { scheduled: created.filter((item) => item.status === "scheduled").length, needsReview: created.filter((item) => item.status === "needs_review").length }, publishResult });
}

function prepareCandidate(raw, { products, existingNews, candidates, config }) {
  const id = crypto.randomUUID();
  const reasons = [];
  const now = new Date().toISOString();
  if (!raw.sourcePublishedAt || Date.now() - new Date(raw.sourcePublishedAt).getTime() > config.lookbackDays * 86400000) reasons.push("source_older_than_90_days_or_missing_date");
  if (!raw.sourceUrl || !/^https:\/\//.test(raw.sourceUrl)) reasons.push("invalid_source_url");
  if (!raw.title || raw.title.length < 12) reasons.push("missing_or_short_source_title");
  if (existingNews.some((item) => canonicalUrl(item.sourceUrl) === raw.sourceUrl) || candidates.some((item) => item.sourceUrl === raw.sourceUrl)) reasons.push("duplicate_source_url");
  const related = matchProducts(raw, products);
  if (!related.length) reasons.push("insufficient_verified_product_relevance");
  const duplicateTitle = existingNews.some((item) => textSimilarity(item.title, raw.title) >= config.titleSimilarityThreshold);
  if (duplicateTitle) reasons.push("duplicate_or_similar_title");
  const sourcePass = raw.source?.trustLevel === "high" || raw.source?.type === "first_party";
  if (!sourcePass) reasons.push("source_not_first_party_or_high_trust");
  const primary = related[0];
  const article = primary ? generateArticle(raw, primary, related) : null;
  if (article && textSimilarity(article.contentText, existingNews.map((item) => item.content || "").join(" ")) >= config.contentSimilarityThreshold) reasons.push("semantic_content_similarity_threshold");
  if (!article?.image) reasons.push("missing_cowinsupply_owned_product_image");
  const status = reasons.length ? "needs_review" : "scheduled";
  return {
    id, status, discoveredAt: now, fetchedAt: raw.sourceFetchedAt, verifiedAt: now, plannedAt: now, generatedAt: now, qualityCheckedAt: now,
    sourceUrl: raw.sourceUrl, sourceFingerprint: raw.sourceFingerprint, eventFingerprint: raw.eventFingerprint, source: raw.source,
    sourceTitle: raw.title, sourceSummary: raw.summary, sourceAuthor: raw.author, sourcePublishedAt: raw.sourcePublishedAt, sourceFetchedAt: raw.sourceFetchedAt,
    eventCountryRegion: raw.eventCountryRegion || "Not specified by source", licenseNote: raw.source.licenseNote,
    productIds: related.map((item) => item.id), productSlugs: related.map((item) => item.slug), productIndustryScenario: `${primary?.category || "Power Tools"}|${article?.industry || "construction"}|${article?.scenario || "jobsite workflow"}`,
    article, rejectionReasons: reasons, qualityGate: { source: !reasons.some((x) => x.includes("source")), relevance: Boolean(related.length), duplicate: !reasons.some((x) => x.includes("duplicate") || x.includes("similarity")), image: Boolean(article?.image), seo: Boolean(article?.seoTitle && article?.canonicalUrl) }
  };
}

function generateArticle(raw, primary, related) {
  const variant = parseInt(sha256(raw.sourceFingerprint).slice(0, 2), 16) % 3;
  const industry = inferIndustry(`${raw.title} ${raw.summary}`);
  const scenario = inferScenario(primary);
  const title = [
    `${shortTitle(raw.title)}: What It Means for ${industry} Tool Workflows`,
    `${industry} Update: A Practical View for ${primary.title} Buyers`,
    `${shortTitle(raw.title)} and the ${primary.category || "industrial tools"} Supply Context`
  ][variant].slice(0, 105);
  const sourceDate = formatDate(raw.sourcePublishedAt);
  const productUrl = `/product/${primary.slug}.html`;
  const categoryUrl = categoryUrlFor(primary);
  const sourceFacts = `${raw.source.publisher} published “${raw.title}” on ${sourceDate}. ${raw.summary || "The source provides an industry update relevant to professional tool users."}`;
  const analysisLead = ["For buyers planning field work", "For distributors serving professional contractors", "For procurement teams reviewing category availability"][variant];
  const productLinks = related.slice(0, 3).map((item) => `<a href="/product/${escapeAttr(item.slug)}.html">${escapeHtml(item.title)}</a>`).join(", ");
  const content = `<h2>What happened</h2><p>${escapeHtml(sourceFacts)}</p>
<h2>Why it matters for ${escapeHtml(industry)}</h2><p>${escapeHtml(analysisLead)} this is a signal to review application requirements, work sequencing and replacement planning. The source is not evidence that CowinSupply products were used in the event; this is an independent industry interpretation.</p>
<h2>Where ${escapeHtml(primary.title)} fits</h2><p><a href="${productUrl}">${escapeHtml(primary.title)}</a> is relevant when the work calls for ${escapeHtml(scenario)}. Buyers should compare the confirmed product specification with the material, voltage and site conditions before purchase.</p>
<h2>Application workflow</h2><p>Measure and mark the work area; select the appropriate cutting, drilling or finishing setup; complete debris control and installation steps; then verify dimensions, fasteners or surface condition before handover.</p>
<h2>Practical value and limits</h2><p>Appropriate tool selection can support repeatable workflow, service planning and jobsite control. It does not remove the need for trained operators, required PPE, local safety procedures or product-specific specification checks.</p>
<h2>Example interpretation</h2><p>Read alongside the linked source, the update suggests that ${escapeHtml(industry.toLowerCase())} buyers may benefit from checking tool availability and application fit earlier in a project cycle. That conclusion is an editorial interpretation, not a claim about third-party project participation.</p>
<h2>Products and category links</h2><p>Review ${productLinks} and the <a href="${categoryUrl}">${escapeHtml(primary.category || "related product category")}</a> category for confirmed product details.</p>
<h2>Sources and verification</h2><p>Source: <a href="${escapeAttr(raw.sourceUrl)}" rel="nofollow noopener" target="_blank">${escapeHtml(raw.source.publisher)}</a>, published ${escapeHtml(sourceDate)}; verified by CowinSupply on ${escapeHtml(formatDate(new Date().toISOString()))}. Original reporting remains the property of the publisher.</p>`;
  const faq = [
    { question: `What is the source for this ${industry} update?`, answer: `${raw.source.publisher} published the referenced update on ${sourceDate}; the original link is shown on this page.` },
    { question: `Does this report mean CowinSupply participated in the event?`, answer: "No. CowinSupply provides independent product and workflow context unless a participation claim is separately verified." },
    { question: `Which product is relevant to this workflow?`, answer: `${primary.title} is the primary contextual product; confirm its published specifications before ordering.` },
    { question: "Can distributors request application support?", answer: "Yes. Contact CowinSupply with the intended material, voltage, quantity and job conditions for a product-fit discussion." }
  ];
  return { title, summary: truncate(`${raw.summary || raw.title} CowinSupply provides independent context for ${industry.toLowerCase()} buyers evaluating ${primary.title}.`, 250), content, contentText: stripHtml(content), image: primary.image, imageAlt: `${primary.title} for ${scenario}`, seoTitle: `${title} | Cowin Supply News`.slice(0, 155), seoDescription: truncate(`${raw.summary || raw.title} Independent industry context for professional ${primary.category || "power tool"} buyers.`, 155), canonicalUrl: `${SITE_URL}/news/${slugify(title)}`, primaryKeyword: primary.title, secondaryKeywords: [primary.category, industry, scenario].filter(Boolean), geoSummary: `CowinSupply connects this verified ${industry.toLowerCase()} update with the application context for ${primary.title}.`, faq, industry, scenario, keyTakeaways: [`${raw.source.publisher} published the cited update on ${sourceDate}.`, `${primary.title} is linked as an application-context product, not a claimed project supply.`, "Product selection still depends on verified specifications, site conditions and trained operation."] };
}

function buildPublishedArticle(candidate, products) {
  const article = candidate.article;
  const slug = uniqueSlug(slugify(article.title), products); // Product slugs cannot collide with News slugs in their separate route namespace.
  return {
    type: "news", slug, title: article.title, category: candidate.source?.publisher || "Industry News", image: article.image, summary: article.summary, status: "published", seoIndexable: true,
    language: "en", content: `${article.content}<h2>FAQ</h2>${article.faq.map((item) => `<h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p>`).join("")}`,
    authorName: "Cowin Supply Editorial", publishedAt: new Date().toISOString(), seoTitle: article.seoTitle, seoDescription: article.seoDescription, canonicalUrl: `${SITE_URL}/news/${slug}`,
    primaryKeyword: article.primaryKeyword, secondaryKeywords: article.secondaryKeywords, geoSummary: article.geoSummary, keyTakeaways: article.keyTakeaways,
    sourceTitle: candidate.sourceTitle, sourceAuthor: candidate.sourceAuthor, sourcePublisher: candidate.source?.publisher, sourceUrl: candidate.sourceUrl, canonicalSourceUrl: candidate.sourceUrl,
    sourceLanguage: "en", sourcePublishedAt: candidate.sourcePublishedAt, sourceFetchedAt: candidate.sourceFetchedAt, sourceTimezone: "UTC", sourceFingerprint: candidate.sourceFingerprint,
    eventFingerprint: candidate.eventFingerprint, contentHash: sha256(article.contentText), relevanceScore: 100, credibilityScore: candidate.source?.trustLevel === "high" ? 90 : 75,
    generationModel: "deterministic-editorial-v2", generationPromptVersion: "news-automation-v2", relatedProducts: candidate.productSlugs.map((productSlug) => ({ productSlug })), originalFacts: candidate.sourceSummary,
    ourAnalysis: `Independent CowinSupply industry analysis for ${article.industry}.`, customerImpact: `Practical procurement context for ${article.industry} buyers.`, ourHelp: `Review ${article.primaryKeyword} specifications and request an application-fit quote.`, faq: article.faq,
    coverImageSourceUrl: article.image, coverImagePageUrl: `${SITE_URL}/product/${candidate.productSlugs[0]}.html`, coverImageAlt: article.imageAlt, coverImageStatus: "cowinsupply-owned-product-media",
    automationVersion: "v2", automationCandidateId: candidate.id, editorialStatus: "auto_published_after_quality_gates", imageLicenseNote: "CowinSupply owned product media"
  };
}

async function fetchSource(source) {
  const summary = { source: source.publisher, rssUrl: source.rssUrl, fetched: 0, accepted: 0, error: "" };
  try {
    const response = await fetch(source.rssUrl, { headers: { "user-agent": "CowinSupply-NewsBot/2.0 (+https://www.cowinsupply.com/news)" }, signal: AbortSignal.timeout(15000), cache: "no-store" });
    if (!response.ok) throw new Error(`http_${response.status}`);
    const xml = await response.text();
    const items = parseRss(xml).map((item) => normalizeSourceItem(item, source)).filter((item) => {
      summary.fetched += 1;
      const valid = item.sourcePublishedAt && Date.now() - new Date(item.sourcePublishedAt).getTime() <= 90 * 86400000;
      if (valid) summary.accepted += 1;
      return valid;
    });
    return { summary, items };
  } catch (error) {
    summary.error = sanitizeError(error);
    return { summary, items: [] };
  }
}

function parseRss(xml) {
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  return blocks.slice(0, 40).map((block) => ({ title: tag(block, "title"), link: tag(block, "link") || attr(block, "link", "href"), summary: tag(block, "description") || tag(block, "summary") || tag(block, "content:encoded"), publishedAt: tag(block, "pubDate") || tag(block, "published") || tag(block, "updated"), author: tag(block, "dc:creator") || tag(block, "author") }));
}

function normalizeSourceItem(item, source) {
  const sourceUrl = canonicalUrl(item.link);
  const title = stripHtml(item.title);
  return { title, summary: truncate(stripHtml(item.summary), 700), sourceUrl, author: stripHtml(item.author), sourcePublishedAt: safeDate(item.publishedAt), sourceFetchedAt: new Date().toISOString(), source, sourceFingerprint: sha256(`${source.id}|${sourceUrl}|${title}`), eventFingerprint: sha256(`${normalizeTitle(title)}|${safeDate(item.publishedAt)?.slice(0, 10)}`) };
}

function matchProducts(raw, products) {
  const text = `${raw.title} ${raw.summary}`.toLowerCase();
  const generic = new Set(["power", "tool", "tools", "industrial", "professional", "machine", "machines", "supply", "heavy", "duty", "construction", "building", "project", "buyer", "buyers", "listing", "product", "products", "and", "with", "for"]);
  return products.map((product) => {
    const words = `${product.title} ${(product.tags || []).join(" ")}`.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length >= 4 && !generic.has(word));
    const matched = [...new Set(words.filter((word) => text.includes(word)))];
    const hasSpecificSignal = matched.some((word) => /laser|tape|chaser|slot|grind|saw|drill|cutter|polish|screwdriver/.test(word));
    return { ...product, matched, score: matched.length, hasSpecificSignal };
  }).filter((item) => item.hasSpecificSignal && item.score >= 1 && item.image).sort((a, b) => b.score - a.score).slice(0, 3);
}

function canPublish(state, candidate, config) {
  return candidate?.status === "scheduled" && !candidate.rejectionReasons?.length && Date.now() - new Date(state.lastSuccessfulPublishAt || 0).getTime() >= config.publishIntervalHours * 3600000;
}
function nextPublishReason(state, config) {
  if (!state.lastSuccessfulPublishAt) return "no_quality_checked_candidate";
  const ms = Date.now() - new Date(state.lastSuccessfulPublishAt).getTime();
  return ms < config.publishIntervalHours * 3600000 ? "publish_interval_not_elapsed" : "no_quality_checked_candidate";
}
async function getConfig() { const saved = await getValue(CONFIG_KEY, {}); return { ...DEFAULT_CONFIG, ...saved, sourceWhitelist: saved.sourceWhitelist || DEFAULT_SOURCES }; }
async function migrateLegacyRules() {
  if (!hasPersistentStore() || (await getPersistentValue(MIGRATION_KEY))?.version === "v2") return;
  await Promise.all([setPersistentValue("news-jobs", []), setPersistentValue("news-publication-audits", []), setPersistentValue("news-sources", [])]);
  await setPersistentValue(MIGRATION_KEY, { version: "v2", migratedAt: new Date().toISOString(), removedKeys: ["news-jobs", "news-publication-audits", "news-sources"], note: "Legacy high-frequency/manual-review News automation records cleared; published News content was preserved." });
}
async function getValue(key, fallback) { return hasPersistentStore() ? (await getPersistentValue(key)) ?? fallback : fallback; }
async function setValue(key, value) { if (hasPersistentStore()) await setPersistentValue(key, value); }
async function recordRun(data) { const logs = await getValue(RUNS_KEY, []); const run = { id: crypto.randomUUID(), completedAt: new Date().toISOString(), ...data }; await setValue(RUNS_KEY, [run, ...logs].slice(0, MAX_LOGS)); return run; }
function defaultState() { return { lastSuccessfulPublishAt: "", lastPublishedSlug: "", updatedAt: "" }; }
function uniqueSlug(base, existing) { const used = new Set(existing.map((item) => item.slug)); let slug = base || `industry-news-${Date.now()}`; let index = 2; while (used.has(slug)) slug = `${base}-${index++}`; return slug; }
function categoryUrlFor(product) { const map = { "Wall Chasers & Concrete Cutting": "/products/wall-chasers", "Cutting Tools": "/products/cutting-tools", "Drilling Tools": "/products/drilling-tools", "Measuring Tools": "/products/measuring-tools", "Surface Finishing Tools": "/products/surface-finishing-tools", "Precision Tools": "/products/precision-tools" }; return map[product.category] || "/product"; }
function inferIndustry(text) { const lower = text.toLowerCase(); if (/hvac|plumb|pipe|electrical/.test(lower)) return "MEP installation"; if (/steel|metal|fabricat/.test(lower)) return "metal fabrication"; if (/renovat|interior|finish/.test(lower)) return "interior renovation"; return "construction"; }
function inferScenario(product) { const text = `${product.title} ${product.category}`.toLowerCase(); if (/laser/.test(text)) return "layout and dimension verification"; if (/drill/.test(text)) return "controlled drilling and installation preparation"; if (/grind|polish/.test(text)) return "surface preparation and finishing"; if (/saw|cut|chaser|slot/.test(text)) return "material cutting, slotting or access preparation"; return "professional tool workflow"; }
function tag(text, name) { const match = text.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i")); return match?.[1] || ""; }
function attr(text, name, attribute) { const match = text.match(new RegExp(`<${name}[^>]*${attribute}=["']([^"']+)["'][^>]*>`, "i")); return match?.[1] || ""; }
function canonicalUrl(value) { try { const url = new URL(value); url.hash = ""; for (const key of [...url.searchParams.keys()]) if (/^utm_|fbclid|gclid/i.test(key)) url.searchParams.delete(key); return url.toString(); } catch { return ""; } }
function safeDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "" : date.toISOString(); }
function normalizeTitle(value) { return stripHtml(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function textSimilarity(a, b) { const words = (value) => new Set(normalizeTitle(value).split(" ").filter((word) => word.length > 3)); const left = words(a), right = words(b); if (!left.size || !right.size) return 0; let shared = 0; for (const word of left) if (right.has(word)) shared += 1; return shared / Math.max(left.size, right.size); }
function shortTitle(value) { return truncate(stripHtml(value).replace(/[.!?].*$/, ""), 72); }
function stripHtml(value) { return decodeHtmlEntities(String(value || "").replace(/<!\[CDATA\[|\]\]>/g, "")).replace(/<(?:figure|img|script|style)[\s\S]*?(?:<\/(?:figure|script|style)>|>)/gi, " ").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); }
function decodeHtmlEntities(value) { let decoded = String(value || ""); for (let index = 0; index < 2; index += 1) decoded = decoded.replace(/&(amp|lt|gt|quot|#39|nbsp);/gi, (_match, entity) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " }[String(entity).toLowerCase()] || _match)); return decoded; }
function truncate(value, length) { const text = String(value || "").trim(); return text.length > length ? `${text.slice(0, length - 1).trim()}…` : text; }
function sha256(value) { return crypto.createHash("sha256").update(String(value)).digest("hex"); }
function escapeHtml(value) { return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
function escapeAttr(value) { return escapeHtml(value).replaceAll("'", "&#39;"); }
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Not available" : date.toISOString().slice(0, 10); }
function safeTimezone(value) { try { Intl.DateTimeFormat("en", { timeZone: value }); return value; } catch { return "Asia/Shanghai"; } }
function clampNumber(value, min, max, fallback) { const number = Number(value); return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback; }
function sanitizeError(error) { return String(error?.message || error || "unknown-error").replace(/DATABASE_URL|POSTGRES_URL|password|secret/gi, "[redacted]").slice(0, 180); }
