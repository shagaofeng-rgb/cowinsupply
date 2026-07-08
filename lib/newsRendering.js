import { buildNewsStructuredData } from "@/lib/newsAutomation";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.cowinsupply.com").replace(/\/$/, "");

export function renderNewsListHtml({ news, products = [], title = "Cowin Supply News" }) {
  const cards = news
    .map((item) => {
      const related = relatedProductTitles(item, products).slice(0, 2).join(", ");
      return `<article class="news-card">
        <a href="/news/${escapeAttr(item.slug)}"><img src="${escapeAttr(item.image || `/api/news/cover/${item.slug}`)}" alt="${escapeAttr(item.coverImageAlt || item.title)}" loading="lazy"></a>
        <div>
          <p class="eyebrow">${escapeHtml(item.category || "Industry News")} ${related ? `· ${escapeHtml(related)}` : ""}</p>
          <h2><a href="/news/${escapeAttr(item.slug)}">${escapeHtml(item.title)}</a></h2>
          <p>${escapeHtml(item.summary || item.seoDescription || "")}</p>
          <div class="meta">${formatDate(item.publishedAt || item.updatedAt || item.createdAt)} · Source: ${escapeHtml(item.sourcePublisher || "Cowin Supply")}</div>
        </div>
      </article>`;
    })
    .join("");

  return baseHtml({
    title,
    description: "Cowin Supply industry news, source summaries and product-linked B2B power tool insights.",
    canonical: `${SITE_URL}/news`,
    body: `<main class="news-shell">
      <section class="news-hero">
        <p class="eyebrow">Industry News</p>
        <h1>Cowin Supply News</h1>
        <p>Recent public-source updates with Cowin Supply analysis, product context and traceable source links.</p>
      </section>
      <section class="news-grid">${cards || emptyState()}</section>
    </main>`
  });
}

export function renderNewsDetailHtml({ article, products = [], relatedNews = [] }) {
  const articleProducts = productsForArticle(article, products);
  const productCards = articleProducts
    .map(
      (product) => `<article class="product-card">
        <img src="${escapeAttr(product.image || "/cowin-assets/product-jigsaw.webp")}" alt="${escapeAttr(product.title)}" loading="lazy">
        <div><strong>${escapeHtml(product.title)}</strong><p>${escapeHtml(product.summary || product.category || "")}</p><a href="/product/${escapeAttr(product.slug)}.html">View product</a></div>
      </article>`
    )
    .join("");
  const relatedLinks = relatedNews
    .filter((item) => item.slug !== article.slug)
    .slice(0, 3)
    .map((item) => `<li><a href="/news/${escapeAttr(item.slug)}">${escapeHtml(item.title)}</a></li>`)
    .join("");
  const jsonLd = JSON.stringify(buildNewsStructuredData(article, articleProducts)).replace(/</g, "\\u003c");

  return baseHtml({
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.summary || "",
    canonical: article.canonicalUrl || `${SITE_URL}/news/${article.slug}`,
    image: article.image || `/api/news/cover/${article.slug}`,
    structuredData: jsonLd,
    body: `<main class="news-shell">
      <nav class="breadcrumbs"><a href="/">Home</a><span>/</span><a href="/news">News</a><span>/</span><span>${escapeHtml(article.title)}</span></nav>
      <article class="news-article">
        <p class="eyebrow">${escapeHtml(article.category || "Industry News")}</p>
        <h1>${escapeHtml(article.title)}</h1>
        <p class="lead">${escapeHtml(article.summary || "")}</p>
        <div class="meta">Published ${formatDate(article.publishedAt || article.createdAt)} · Updated ${formatDate(article.updatedAt || article.publishedAt || article.createdAt)} · ${escapeHtml(article.authorName || "Cowin Supply Editorial")}</div>
        <img class="article-cover" src="${escapeAttr(article.image || `/api/news/cover/${article.slug}`)}" alt="${escapeAttr(article.coverImageAlt || article.title)}">
        <section class="takeaways">
          <h2>Key takeaways</h2>
          <ul>${(article.keyTakeaways || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </section>
        <section class="article-body">${sanitizeArticleHtml(article.content || `<p>${escapeHtml(article.summary || "")}</p>`)}</section>
        <section class="source-box">
          <h2>Source information</h2>
          <dl>
            <dt>Original title</dt><dd>${escapeHtml(article.sourceTitle || article.title)}</dd>
            <dt>Publisher</dt><dd>${escapeHtml(article.sourcePublisher || "Cowin Supply")}</dd>
            <dt>Original published time</dt><dd>${escapeHtml(article.sourcePublishedAt || "Not available")}</dd>
            <dt>Collected time</dt><dd>${escapeHtml(article.sourceFetchedAt || article.createdAt || "")}</dd>
            <dt>Original link</dt><dd>${article.sourceUrl ? `<a href="${escapeAttr(article.sourceUrl)}" rel="nofollow noopener" target="_blank">${escapeHtml(article.sourceUrl)}</a>` : "Not available"}</dd>
          </dl>
          <p>This article is based on public source information for summary and independent analysis. Original reporting copyright belongs to the original publisher.</p>
        </section>
        <section>
          <h2>Related products</h2>
          <div class="product-grid">${productCards || "<p>No related product is currently available.</p>"}</div>
        </section>
        <section>
          <h2>Related news</h2>
          <ul>${relatedLinks || "<li>No related news yet.</li>"}</ul>
        </section>
      </article>
    </main>`
  });
}

export function renderNewsFeedXml(news) {
  const items = news
    .slice(0, 30)
    .map(
      (item) => `<item>
        <title><![CDATA[${item.title}]]></title>
        <link>${SITE_URL}/news/${item.slug}</link>
        <guid>${SITE_URL}/news/${item.slug}</guid>
        <description><![CDATA[${item.summary || item.seoDescription || ""}]]></description>
        <pubDate>${new Date(item.publishedAt || item.updatedAt || item.createdAt).toUTCString()}</pubDate>
      </item>`
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Cowin Supply News</title><link>${SITE_URL}/news</link><description>Cowin Supply industry news and product analysis.</description>${items}</channel></rss>`;
}

export function renderGeneratedCoverSvg(title = "Cowin Supply News") {
  const clean = escapeHtml(title).slice(0, 90);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#071525"/>
    <rect x="70" y="70" width="1060" height="490" rx="28" fill="#102033" stroke="#38d9ee" stroke-opacity=".35"/>
    <circle cx="1030" cy="142" r="54" fill="#ffd625"/>
    <path d="M140 430h920" stroke="#38d9ee" stroke-opacity=".4" stroke-width="5"/>
    <text x="120" y="150" fill="#38d9ee" font-family="Arial, sans-serif" font-size="34" font-weight="700">COWIN SUPPLY NEWS</text>
    <foreignObject x="120" y="205" width="900" height="210"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,sans-serif;color:white;font-size:54px;font-weight:800;line-height:1.12">${clean}</div></foreignObject>
    <text x="120" y="505" fill="#d7e9ff" font-family="Arial, sans-serif" font-size="28">Public-source summary · Product-linked B2B analysis</text>
  </svg>`;
}

function baseHtml({ title, description, canonical, image = "/api/news/cover/cowin-news", structuredData = "", body }) {
  const absoluteImage = new URL(image, SITE_URL).toString();
  return `<!doctype html><html lang="en"><head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeAttr(description)}">
    <link rel="canonical" href="${escapeAttr(canonical)}">
    <meta property="og:title" content="${escapeAttr(title)}"><meta property="og:description" content="${escapeAttr(description)}"><meta property="og:image" content="${escapeAttr(absoluteImage)}"><meta property="og:type" content="article">
    <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeAttr(title)}"><meta name="twitter:description" content="${escapeAttr(description)}"><meta name="twitter:image" content="${escapeAttr(absoluteImage)}">
    <link rel="stylesheet" href="/cowin-assets/site.css">
    <style>${newsCss()}</style>
    ${structuredData ? `<script type="application/ld+json">${structuredData}</script>` : ""}
  </head><body><header class="site-header"><a href="/" class="brand">Cowin Supply</a><nav><a href="/product">Products</a><a href="/news">News</a><a href="/about">About</a><a href="/contact">Contact</a></nav></header>${body}<footer class="site-footer"><p>© Cowin Supply</p></footer></body></html>`;
}

function newsCss() {
  return `.news-shell{max-width:1180px;margin:0 auto;padding:42px 20px}.news-hero{margin-bottom:28px}.news-hero h1,.news-article h1{font-size:clamp(34px,5vw,62px);line-height:1.05;margin:8px 0}.eyebrow{color:#0f766e;font-weight:800;text-transform:uppercase;letter-spacing:.04em}.news-grid{display:grid;gap:18px}.news-card{display:grid;grid-template-columns:260px 1fr;gap:20px;padding:18px;border:1px solid #d9e1ea;border-radius:8px;background:white}.news-card img,.article-cover{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:8px}.news-card h2{font-size:24px;margin:6px 0}.news-card a,.product-card a{color:#0f766e}.meta{color:#667085;font-size:14px}.breadcrumbs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px}.lead{font-size:20px;color:#344054}.news-article{display:grid;gap:22px}.article-body{font-size:18px;line-height:1.75}.article-body h2,.source-box h2{margin-top:24px}.takeaways,.source-box{border:1px solid #d9e1ea;border-radius:8px;padding:18px;background:#f8fafc}.source-box dl{display:grid;grid-template-columns:190px 1fr;gap:8px}.source-box dt{font-weight:800}.product-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}.product-card{border:1px solid #d9e1ea;border-radius:8px;padding:14px;background:white}.product-card img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:6px}@media(max-width:720px){.news-card{grid-template-columns:1fr}.source-box dl{grid-template-columns:1fr}.site-header{flex-wrap:wrap}}`;
}

function productsForArticle(article, products) {
  const slugs = new Set((article.relatedProducts || []).map((item) => item.productSlug || item.slug));
  return products.filter((product) => slugs.has(product.slug)).slice(0, 3);
}

function relatedProductTitles(article, products) {
  return productsForArticle(article, products).map((product) => product.title);
}

function sanitizeArticleHtml(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/javascript:/gi, "");
}

function emptyState() {
  return `<div class="takeaways"><h2>No published News yet</h2><p>The automation system is ready. Configure NEWS_SOURCE_FEEDS to publish verified source-based articles.</p></div>`;
}

function formatDate(value) {
  if (!value) return "Not dated";
  try {
    return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(value));
  } catch {
    return value;
  }
}

function escapeHtml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}
