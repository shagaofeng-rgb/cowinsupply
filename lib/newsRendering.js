import {
  SITE_URL, articleContent, articleDate, articleLayout, assetUrl, breadcrumbs, button, escapeHtml, icon,
  interiorPage, kicker, media, pageHeading, paginationNav, textLink
} from "@/lib/interiorRendering";

const newsUrl = article => `/news/${encodeURIComponent(article.slug)}`;

export function newsMatchesProduct(article, product) {
  return (article.relatedProducts || []).some(item =>
    (item.productSlug || item.slug) === product.slug || (item.productId && item.productId === product.id)
  );
}

function articleCover(article, products) {
  // A buyer briefing can have a stale cover in CMS; its published product is
  // authoritative for the model photo. Other articles retain editorial covers.
  const isBriefing = /^buyer briefing$/i.test(article.category || "");
  const correctProduct = isBriefing && products.find(product => newsMatchesProduct(article, product));
  return {
    src: assetUrl(isBriefing ? correctProduct?.image : article.image) || `/api/news/cover/${encodeURIComponent(article.slug)}`,
    alt: correctProduct?.title || (isBriefing ? article.title : article.coverImageAlt || article.title)
  };
}

function newsSchema(article, canonical, image, description, products, faqs) {
  const published = article.publishedAt || article.createdAt;
  const schemas = [
    { "@context": "https://schema.org", "@type": "NewsArticle", headline: article.title, description, image: new URL(image, SITE_URL).href,
      datePublished: published, dateModified: article.updatedAt || published,
      author: { "@type": "Organization", name: article.authorName || "Cowin Supply Editorial" },
      publisher: { "@type": "Organization", name: "Cowin Supply", logo: { "@type": "ImageObject", url: `${SITE_URL}/cowin-assets/cowin-logo.png` } },
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical }, articleSection: article.category || "Company News",
      keywords: [article.primaryKeyword, ...(article.secondaryKeywords || [])].filter(Boolean).join(", "),
      ...(article.sourceUrl ? { citation: article.sourceUrl } : {}),
      ...(products.length ? { about: products.map(product => ({ "@type": "Thing", name: product.title, url: `${SITE_URL}/product/${encodeURIComponent(product.slug)}.html` })) } : {}) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "News", item: `${SITE_URL}/news` },
      { "@type": "ListItem", position: 3, name: article.title, item: canonical }
    ] }
  ];
  if (faqs.length) schemas.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(item => ({
    "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer }
  })) });
  return schemas;
}

function field(name, label, empty, values, selected) {
  return `<label><span class="cw-sr">${label}</span><select name="${name}"><option value="">${empty}</option>
    ${values.map(([value, label]) => `<option value="${escapeHtml(value)}"${String(value) === String(selected || "") ? " selected" : ""}>${escapeHtml(label)}</option>`).join("")}
  </select></label>`;
}

function newsFilters(filters, options) {
  const choices = list => (list || []).map(value => [value, value]);
  return `<form class="cw-news-filter" method="get" action="/news" role="search" aria-label="Search and filter news">
    <label class="cw-search-field">${icon("search")}<span class="cw-sr">Search news</span><input type="search" name="q" maxlength="160" value="${escapeHtml(filters.q || "")}" placeholder="Search news"></label>
    <details class="cw-news-options" data-collapsible-wide="980" open><summary>Filters${icon("chevron-down")}</summary><div>
      ${field("category", "Category", "All categories", choices(options.categories), filters.category)}
      ${field("product", "Product", "All products", (options.products || []).map(product => [product.slug, product.title]), filters.product)}
      ${field("source", "Source", "All sources", choices(options.sources), filters.source)}
      ${field("language", "Language", "All languages", choices(options.languages), filters.language)}
      ${field("period", "Publication date", "Any date", [["day", "Last 24 hours"], ["week", "Last 7 days"], ["month", "Last 31 days"]], filters.period)}
    </div></details>
    ${filters.tag ? `<input type="hidden" name="tag" value="${escapeHtml(filters.tag)}">` : ""}
    ${filters.pageSize ? `<input type="hidden" name="pageSize" value="${escapeHtml(filters.pageSize)}">` : ""}
    <button type="submit" class="cw-button cw-button-dark">Apply</button>
  </form>`;
}

function row(article, products) {
  const href = newsUrl(article);
  const { src, alt } = articleCover(article, products);
  const product = products.find(product => newsMatchesProduct(article, product));
  return `<article class="cw-news-row">
    <a href="${href}" class="cw-card-media-link" aria-label="Read ${escapeHtml(article.title)}">${media(src, alt, { product: Boolean(product) })}</a>
    <div>${kicker(article.category || "Company News")}<h2><a href="${href}">${escapeHtml(article.title)}</a></h2>
      <p class="cw-row-description">${escapeHtml(safeArticleDescription(article))}</p>
      <p class="cw-byline">${[articleDate(article.publishedAt || article.updatedAt || article.createdAt), escapeHtml(article.sourcePublisher || "Cowin Supply")].filter(Boolean).join(" · ")}</p>
    </div>${textLink("Read briefing", href)}
  </article>`;
}

export function renderNewsListHtml({ news, products = [], filters = {}, options = {}, pagination }) {
  const activeFilters = ["q", "category", "product", "source", "language", "tag", "period", "pageSize"].some(key => Boolean(filters[key]));
  const description = "Product briefings and updates from Cowin Supply.";
  const href = page => {
    const params = new URLSearchParams(Object.entries(filters).filter(([key, value]) => key !== "page" && value));
    if (page > 1) params.set("page", String(page));
    return `/news${params.size ? `?${params}` : ""}`;
  };
  return interiorPage({
    title: `Cowin Supply Company and Product News${!activeFilters && pagination.page > 1 ? ` | Page ${pagination.page}` : ""}`, description,
    canonical: `${SITE_URL}/news${!activeFilters && pagination.page > 1 ? `?page=${pagination.page}` : ""}`, active: "/news",
    ...(activeFilters ? { robots: "noindex,follow" } : {}),
    body: `<main class="cw-wrap cw-page" id="main-content">
      ${breadcrumbs([["News"]])}${pageHeading("Company updates", "Cowin Supply News", description)}
      ${newsFilters(filters, options)}
      ${activeFilters ? `<p class="cw-result-count">${pagination.total} ${pagination.total === 1 ? "result" : "results"} · <a class="cw-text-link" href="/news">Clear filters</a></p>` : ""}
      ${news.length ? `<section class="cw-news-list" aria-label="Published news">${news.map(article => row(article, products)).join("")}</section>` : `<div class="cw-empty">${icon(activeFilters ? "search" : "news")}<h2>${activeFilters ? "No matching news" : "No news published yet"}</h2><p>${activeFilters ? "Try another keyword or clear the filters." : "Visit the Blog for product and sourcing guides."}</p>${button(activeFilters ? "Clear filters" : "Visit the Blog", activeFilters ? "/news" : "/blog", { secondary: true })}</div>`}
      ${paginationNav({ page: pagination.page, totalPages: pagination.pageCount, href })}
    </main>`
  });
}

function sourceDetails(article) {
  const source = typeof article.sourceUrl === "string" && /^https?:\/\//i.test(article.sourceUrl) ? article.sourceUrl : "";
  const originalDate = articleDate(article.sourcePublishedAt);
  const fetched = articleDate(article.sourceFetchedAt || article.createdAt);
  return `<section class="cw-source"><h2>Source information</h2><dl>
    <dt>Original title</dt><dd>${escapeHtml(article.sourceTitle || article.title)}</dd>
    <dt>Publisher</dt><dd>${escapeHtml(article.sourcePublisher || "Cowin Supply")}</dd>
    ${originalDate ? `<dt>Original publication</dt><dd>${originalDate}</dd>` : ""}
    ${fetched ? `<dt>Collected</dt><dd>${fetched}</dd>` : ""}
    ${source ? `<dt>Original link</dt><dd><a class="cw-text-link" href="${escapeHtml(source)}" rel="nofollow noopener noreferrer" target="_blank">Open original source ${icon("arrow-right")}</a></dd>` : ""}
  </dl>${article.editorialDisclaimer ? `<p>${escapeHtml(article.editorialDisclaimer)}</p>` : ""}</section>`;
}

export function renderNewsDetailHtml({ article, products = [], relatedNews = [] }) {
  const matchingProducts = products.filter(product => newsMatchesProduct(article, product)).slice(0, 3);
  const related = relatedNews.filter(item => item.slug !== article.slug && (
    matchingProducts.some(product => newsMatchesProduct(item, product)) || item.category === article.category
  )).slice(0, 3);
  const canonical = article.canonicalUrl || `${SITE_URL}${newsUrl(article)}`;
  const { src, alt } = articleCover(article, products);
  const description = safeArticleDescription(article);
  const takeaways = (article.keyTakeaways || []).filter(Boolean);
  const faqs = (Array.isArray(article.faq) ? article.faq : []).filter(item => item?.question && item?.answer);
  const content = articleContent(`${takeaways.length ? `<section><h2 id="takeaways">Key takeaways</h2><ul>${takeaways.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>` : ""}${decodeHtmlEntities(article.content || `<p>${escapeHtml(description)}</p>`)}`, { removeMedia: true });
  const body = articleLayout({
    label: article.category || "Company News", title: article.title, summary: description,
    byline: [articleDate(article.publishedAt || article.createdAt), escapeHtml(article.authorName || "Cowin Supply Editorial")].filter(Boolean).join(" · "),
    cover: `<figure class="cw-article-cover">${media(src, alt, { eager: true, product: Boolean(matchingProducts.length) })}</figure>`,
    content: content.html, headings: content.headings, tocTitle: "In this briefing",
    aside: matchingProducts.map(product => `<section><h2>${escapeHtml(product.model || product.title)}</h2>${media(product.image, product.title, { product: true })}${button("View model", `/product/${encodeURIComponent(product.slug)}.html`, { graphic: "arrow-right" })}</section>`).join(""),
    after: `${faqs.length ? `<section class="cw-article-related cw-faq"><h2>Frequently asked questions</h2>${faqs.map(item => `<details><summary>${escapeHtml(item.question)}${icon("chevron-down")}</summary><p>${escapeHtml(item.answer)}</p></details>`).join("")}</section>` : ""}
      ${sourceDetails(article)}
      ${related.length ? `<section class="cw-article-related"><h2>Related news</h2><ul>${related.map(item => `<li>${textLink(item.title, newsUrl(item))}</li>`).join("")}</ul></section>` : ""}`
  });
  return interiorPage({
    title: article.seoTitle || article.title, description, canonical, image: src, type: "article", active: "/news",
    schema: newsSchema(article, canonical, src, description, matchingProducts, faqs),
    body: `<main class="cw-wrap cw-page" id="main-content">${breadcrumbs([["News", "/news"], [article.category || "News article"]])}${body}</main>`
  });
}

function cleanPlainText(value) {
  return decodeHtmlEntities(String(value || "")).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function safeArticleDescription(article) {
  const raw = String(article?.summary || article?.seoDescription || "");
  const cleaned = cleanPlainText(raw);
  if (/(?:<|&lt;|&amp;lt;|imgproxy|\bsrc\s*=)/i.test(raw) || /(?:<|&lt;|&amp;lt;|imgproxy|\bsrc\s*=)/i.test(cleaned) || cleaned.length < 36) {
    const product = article?.primaryKeyword ? ` for professional buyers evaluating ${article.primaryKeyword}` : " for professional B2B buyers";
    return `Cowin Supply provides an independent, source-linked industry interpretation${product}.`;
  }
  return cleaned.slice(0, 300);
}

function decodeHtmlEntities(value) {
  let decoded = String(value || "");
  for (let index = 0; index < 2; index += 1) {
    decoded = decoded.replace(/&(amp|lt|gt|quot|#39|nbsp);/gi, (_match, entity) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " }[String(entity).toLowerCase()] || _match));
  }
  return decoded;
}

const FEED_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.cowinsupply.com").replace(/\/$/, "");

export function renderNewsFeedXml(news) {
  const items = news
    .slice(0, 30)
    .map(
      (item) => `<item>
        <title><![CDATA[${item.title}]]></title>
        <link>${FEED_SITE_URL}/news/${item.slug}</link>
        <guid>${FEED_SITE_URL}/news/${item.slug}</guid>
        <description><![CDATA[${item.summary || item.seoDescription || ""}]]></description>
        <pubDate>${new Date(item.publishedAt || item.updatedAt || item.createdAt).toUTCString()}</pubDate>
      </item>`
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Cowin Supply News</title><link>${FEED_SITE_URL}/news</link><description>Cowin Supply industry news and product analysis.</description>${items}</channel></rss>`;
}

export function renderGeneratedCoverSvg(title = "Cowin Supply News") {
  const clean = escapeHtml(title).slice(0, 90);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#071525"/>
    <rect x="70" y="70" width="1060" height="490" rx="28" fill="#102033" stroke="#38d9ee" stroke-opacity=".35"/>
    <circle cx="1030" cy="142" r="54" fill="#ffd625"/>
    <path d="M140 430h920" stroke="#38d9ee" stroke-opacity=".4" stroke-width="5"/>
    <text x="120" y="150" fill="#38d9ee" font-family="Aptos, Segoe UI, sans-serif" font-size="34" font-weight="700">COWIN SUPPLY NEWS</text>
    <foreignObject x="120" y="205" width="900" height="210"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Aptos,'Segoe UI',sans-serif;color:white;font-size:54px;font-weight:800;line-height:1.12">${clean}</div></foreignObject>
    <text x="120" y="505" fill="#d7e9ff" font-family="Aptos, Segoe UI, sans-serif" font-size="28">Public-source summary · Product-linked B2B analysis</text>
  </svg>`;
}
