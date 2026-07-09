import crypto from "node:crypto";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.cowinsupply.com").replace(/\/$/, "");
let cached = { expiresAt: 0, items: [] };

export async function getLiveNewsItems(products = []) {
  const feeds = String(process.env.NEWS_SOURCE_FEEDS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!feeds.length || !products.length) return [];
  if (cached.expiresAt > Date.now()) return cached.items;

  const items = [];
  for (const feedUrl of feeds) {
    try {
      const response = await fetch(feedUrl, {
        headers: { "user-agent": "CowinSupplyNewsBot/1.0 (+https://www.cowinsupply.com)" },
        signal: AbortSignal.timeout(10000),
        next: { revalidate: 900 }
      });
      if (!response.ok) continue;
      const xml = await response.text();
      const sourceHost = new URL(feedUrl).hostname.replace(/^www\./, "");
      for (const entry of parseRss(xml).slice(0, 8)) {
        const publishedAt = normalizeDate(entry.pubDate);
        if (!isRecent(publishedAt, Number(process.env.NEWS_LOOKBACK_HOURS || 72))) continue;
        const relatedProducts = scoreProducts(entry, products).slice(0, 3);
        if (!relatedProducts.length) continue;
        const sourceUrl = canonicalizeUrl(entry.link);
        const sourceFingerprint = sha256(`${sourceHost}|${sourceUrl}|${entry.title}`);
        const slug = slugify(`${entry.title}-${sourceHost}`).slice(0, 86);
        const primaryProduct = relatedProducts[0];
        items.push({
          id: `live-news-${sourceFingerprint.slice(0, 16)}`,
          type: "news",
          slug,
          title: rewriteTitle(entry.title, primaryProduct.productTitle),
          category: "Industry News",
          image: `/api/news/cover/${slug}`,
          status: "published",
          summary: textOnly(entry.description || entry.title).slice(0, 260),
          createdAt: publishedAt,
          updatedAt: new Date().toISOString(),
          language: "en",
          content: buildContent(entry, sourceHost, relatedProducts, publishedAt),
          authorName: "Cowin Supply Editorial",
          publishedAt: new Date().toISOString(),
          seoTitle: `${rewriteTitle(entry.title, primaryProduct.productTitle)} | Cowin Supply News`,
          seoDescription: textOnly(entry.description || entry.title).slice(0, 160),
          canonicalUrl: `${SITE_URL}/news/${slug}`,
          primaryKeyword: primaryProduct.productTitle,
          secondaryKeywords: relatedProducts.map((item) => item.productCategory).filter(Boolean),
          geoSummary: `${sourceHost} reported this update within 72 hours; Cowin Supply connects it to ${relatedProducts.map((item) => item.productTitle).join(", ")}.`,
          keyTakeaways: [
            "The source item is from a public RSS feed and is within the configured 72-hour window.",
            `The topic is connected to ${primaryProduct.productTitle} and related procurement decisions.`,
            "Cowin Supply provides independent B2B product context instead of republishing the original full article."
          ],
          sourceTitle: entry.title,
          sourceAuthor: entry.author || "",
          sourcePublisher: sourceHost,
          sourceUrl,
          canonicalSourceUrl: sourceUrl,
          sourceLanguage: "en",
          sourcePublishedAt: publishedAt,
          sourceFetchedAt: new Date().toISOString(),
          sourceTimezone: "UTC",
          sourceFingerprint,
          eventFingerprint: sha256(`${normalizeTitle(entry.title)}|${publishedAt.slice(0, 10)}`),
          contentHash: sha256(`${entry.title}|${entry.description}`),
          relevanceScore: primaryProduct.relevanceScore,
          credibilityScore: 80,
          relatedProducts,
          originalFacts: `${sourceHost} published "${entry.title}" on ${publishedAt}.`,
          ourAnalysis: `Cowin Supply treats this as a useful market signal for buyers evaluating ${primaryProduct.productTitle} and adjacent product categories.`,
          customerImpact: "Buyers can use this update to review sourcing timing, application fit and supplier readiness.",
          ourHelp: `Cowin Supply can help compare related products including ${relatedProducts.map((item) => item.productTitle).join(", ")}.`,
          faq: [
            { question: "What is the original source?", answer: `${sourceHost}: ${entry.title}` },
            { question: "Which Cowin Supply products are related?", answer: relatedProducts.map((item) => item.productTitle).join(", ") }
          ],
          coverImageSourceUrl: `${SITE_URL}/api/news/cover/${slug}`,
          coverImagePageUrl: sourceUrl,
          coverImageAlt: `${primaryProduct.productTitle} industry news illustration`,
          coverImageStatus: "generated"
        });
      }
    } catch {
      // Individual source failures should not break the public News page.
    }
  }

  const unique = dedupe(items).slice(0, 8);
  cached = { expiresAt: Date.now() + 15 * 60 * 1000, items: unique };
  return unique;
}

function parseRss(xml) {
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  return blocks.map((block) => ({
    title: textOnly(tagValue(block, "title")),
    link: tagValue(block, "link"),
    description: textOnly(tagValue(block, "description") || tagValue(block, "summary")),
    pubDate: tagValue(block, "pubDate") || tagValue(block, "published") || tagValue(block, "updated"),
    author: textOnly(tagValue(block, "author") || tagValue(block, "dc:creator"))
  }));
}

function scoreProducts(entry, products) {
  const text = `${entry.title} ${entry.description} construction manufacturing supplier industrial power tool saw cutting drilling grinder wall`.toLowerCase();
  return products
    .map((product) => {
      const terms = [product.title, product.category, product.summary].filter(Boolean);
      let relevanceScore = 6;
      for (const term of terms) {
        for (const chunk of String(term).toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2)) {
          if (text.includes(chunk)) relevanceScore += chunk.length > 6 ? 8 : 4;
        }
      }
      return {
        productId: product.id,
        productSlug: product.slug,
        productTitle: product.title,
        productCategory: product.category || "Products",
        productImage: product.image,
        productSummary: product.summary,
        relevanceScore,
        relationshipReason: `Matched public source topic with ${product.title} and Cowin Supply industrial product categories.`,
        displayOrder: 0
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .map((item, index) => ({ ...item, displayOrder: index + 1 }));
}

function buildContent(entry, sourceHost, relatedProducts, publishedAt) {
  const productLinks = relatedProducts.map((item) => `<a href="/product/${item.productSlug}.html">${escapeHtml(item.productTitle)}</a>`).join(", ");
  return [
    `<p><strong>Core conclusion:</strong> ${escapeHtml(textOnly(entry.description || entry.title))}</p>`,
    "<h2>Original source facts</h2>",
    `<p>${escapeHtml(sourceHost)} published "${escapeHtml(entry.title)}" on ${escapeHtml(publishedAt)}. This page summarizes the public source and does not republish the original article in full.</p>`,
    "<h2>Why it matters</h2>",
    "<p>The update is relevant to construction, manufacturing, jobsite productivity, workshop planning and industrial supply decisions.</p>",
    "<h2>Cowin Supply view</h2>",
    "<p>For B2B buyers, the practical question is whether market, infrastructure or manufacturing changes affect tool selection, delivery timing and after-sales expectations.</p>",
    "<h2>How Cowin Supply can help</h2>",
    `<p>Related Cowin Supply products include ${productLinks}. Customers can review these product pages or contact our team for application-specific sourcing support.</p>`
  ].join("\n");
}

function tagValue(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeEntities(String(match?.[1] || "").replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, ""));
}

function textOnly(value) {
  return decodeEntities(String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function decodeEntities(value) {
  return String(value).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function normalizeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function isRecent(value, hours) {
  const time = new Date(value).getTime();
  return Boolean(time) && Date.now() - time <= hours * 60 * 60 * 1000 && time <= Date.now() + 5 * 60 * 1000;
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

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.canonicalSourceUrl || item.slug;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function rewriteTitle(title, productTitle) {
  const clean = textOnly(title).slice(0, 92);
  return clean.toLowerCase().includes(String(productTitle).toLowerCase()) ? clean : `${clean}: Cowin Supply product context`;
}

function normalizeTitle(value) {
  return textOnly(value).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, " ").trim();
}

function slugify(value = "") {
  return String(value).toLowerCase().trim().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function escapeHtml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
