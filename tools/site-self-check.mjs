const baseUrl = (process.env.SELF_CHECK_BASE_URL || process.argv[2] || "http://localhost:3000").replace(/\/$/, "");

const pages = [
  { path: "/", name: "home", expectHtml: true },
  { path: "/product", name: "product-list", expectHtml: true },
  { path: "/news", name: "news-list", expectHtml: true },
  { path: "/contact", name: "contact", expectHtml: true },
  { path: "/api/news", name: "news-api" },
  { path: "/api/news/categories", name: "news-categories-api" },
  { path: "/api/news/feed", name: "news-rss" },
  { path: "/api/content/sitemap", name: "content-sitemap" },
  { path: "/robots.txt", name: "robots" },
  { path: "/sitemap.xml", name: "sitemap-index" },
  { path: "/sitemaps/sitemap-pages.xml", name: "sitemap-pages" },
  { path: "/sitemaps/sitemap-products.xml", name: "sitemap-products" },
  { path: "/sitemaps/sitemap-posts.xml", name: "sitemap-posts" },
  { path: "/sitemaps/sitemap-categories.xml", name: "sitemap-categories" },
  { path: "/api/health", name: "health" }
];

const results = [];

for (const page of pages) {
  results.push(await checkUrl(page));
}

const newsApi = await readJson("/api/news");
const firstNews = newsApi?.data?.items?.[0] || newsApi?.items?.[0];
if (firstNews?.slug) {
  results.push(await checkUrl({ path: `/news/${firstNews.slug}`, name: "news-detail", expectHtml: true, expectJsonLd: true, expectCanonical: true }));
  results.push(await checkUrl({ path: `/api/news/${firstNews.slug}`, name: "news-detail-api" }));
  results.push(await checkUrl({ path: `/api/news/cover/${firstNews.slug}`, name: "news-cover" }));
}

const failed = results.filter((item) => !item.ok);
console.log(JSON.stringify({ baseUrl, checkedAt: new Date().toISOString(), total: results.length, failed: failed.length, results }, null, 2));
if (failed.length) process.exit(1);

async function checkUrl(page) {
  const started = Date.now();
  const url = `${baseUrl}${page.path}`;
  try {
    const response = await fetch(url, { redirect: "manual" });
    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();
    const issues = [];
    if (response.status < 200 || response.status >= 400) issues.push(`HTTP ${response.status}`);
    if (page.expectHtml && !contentType.includes("text/html")) issues.push(`Expected HTML, got ${contentType}`);
    if (page.expectHtml && !/<title>.+<\/title>/i.test(text)) issues.push("Missing title");
    if (page.expectCanonical && !/rel=["']canonical["']/i.test(text)) issues.push("Missing canonical");
    if (page.expectJsonLd && !/application\/ld\+json/i.test(text)) issues.push("Missing JSON-LD");
    if (page.name === "news-rss" && !/<rss/i.test(text)) issues.push("RSS feed invalid");
    if (page.name === "sitemap-index" && !/<sitemapindex[\s>]/i.test(text)) issues.push("Sitemap index invalid");
    if (page.name.startsWith("sitemap-") && page.name !== "sitemap-index" && !/<urlset[\s>]/i.test(text)) issues.push("Sitemap urlset invalid");
    if (page.name.startsWith("sitemap-") && !/https:\/\/www\.cowinsupply\.com/i.test(text)) issues.push("Sitemap missing absolute production URLs");
    if (page.name.startsWith("sitemap-") && /\/(admin|login|search)(\/|<|\?|$)/i.test(text)) issues.push("Sitemap includes blocked URL");
    if (page.name === "robots" && !/Sitemap:\s*https:\/\/www\.cowinsupply\.com\/sitemap\.xml/i.test(text)) issues.push("robots.txt missing production sitemap");
    if (/password|SMTP_PASSWORD|GOOGLE_SERVICE_ACCOUNT|PRIVATE KEY/i.test(text)) issues.push("Potential secret leak marker");
    return { ...page, url, status: response.status, ms: Date.now() - started, ok: !issues.length, issues };
  } catch (error) {
    return { ...page, url, status: 0, ms: Date.now() - started, ok: false, issues: [error.message] };
  }
}

async function readJson(path) {
  try {
    const response = await fetch(`${baseUrl}${path}`);
    return await response.json();
  } catch {
    return null;
  }
}
