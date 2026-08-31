const baseUrl = (process.argv[2] || "https://www.cowinsupply.com").replace(/\/$/, "");
const origin = new URL(baseUrl).origin;
const issues = [];

const home = await timedFetch("/");
checkSecurityHeaders(home.response.headers);

const sitemapIndex = await readText("/sitemap.xml");
const sitemapPaths = extractLocs(sitemapIndex.body).map((url) => new URL(url).pathname);
const sitemapBodies = await Promise.all(sitemapPaths.map(readText));
const publicPaths = [...new Set(sitemapBodies.flatMap((item) => extractLocs(item.body).map((url) => new URL(url).pathname)))];

const pages = await mapWithConcurrency(publicPaths, 4, inspectPage);
const internalLinks = [...new Set(pages.flatMap((page) => page.internalLinks))];
const imageUrls = [...new Set(pages.flatMap((page) => page.images))];
const [linkChecks, imageChecks] = await Promise.all([
  mapWithConcurrency(internalLinks, 6, inspectInternalLink),
  mapWithConcurrency(imageUrls, 6, inspectImage)
]);

const [products, news, blog, protectedChecks, compatibilityChecks] = await Promise.all([
  readJson("/api/content/products?pageSize=100"),
  readJson("/api/content/news?pageSize=100"),
  readJson("/api/content/blog?pageSize=100"),
  Promise.all([
    expectStatus("/api/admin/summary", 401),
    expectStatus("/api/admin/content/products", 401),
    expectStatus("/api/cron/news-daily", 401),
    expectStatus("/api/cron/sitemap", 401)
  ]),
  Promise.all([
    expectRedirect("/es/blog", "/blog"),
    expectRedirect("/es/blog/audit-compatibility", "/blog/audit-compatibility")
  ])
]);

const productItems = products.body?.data?.items || [];
const newsItems = news.body?.data?.items || [];
const blogItems = blog.body?.data?.items || [];
checkContent("product", productItems, publicPaths.filter((path) => path.startsWith("/product/")).length);
checkContent("news", newsItems, publicPaths.filter((path) => path.startsWith("/news/")).length);
checkContent("blog", blogItems, publicPaths.filter((path) => path.startsWith("/blog/")).length);
checkNewsTitles(newsItems);

for (const page of pages) issues.push(...page.issues);
for (const link of linkChecks) if (!link.ok) issues.push({ severity: "P1", area: "link", target: link.url, issue: `HTTP ${link.status}` });
for (const image of imageChecks) if (!image.ok) issues.push({ severity: "P1", area: "image", target: image.url, issue: `HTTP ${image.status}` });

const report = {
  baseUrl,
  checkedAt: new Date().toISOString(),
  summary: {
    sitemapUrls: publicPaths.length,
    pages: pages.length,
    internalLinks: internalLinks.length,
    images: imageUrls.length,
    products: productItems.length,
    news: newsItems.length,
    blog: blogItems.length,
    issues: issues.length,
    bySeverity: countBy(issues, "severity")
  },
  checks: {
    homeMs: home.ms,
    protected: protectedChecks,
    compatibilityRedirects: compatibilityChecks,
    slowestPages: pages.slice().sort((a, b) => b.ms - a.ms).slice(0, 10).map(({ path, ms }) => ({ path, ms }))
  },
  issues
};

console.log(JSON.stringify(report, null, 2));
if (issues.some((issue) => ["P0", "P1", "P2"].includes(issue.severity))) process.exitCode = 1;

async function inspectPage(path) {
  const started = Date.now();
  const response = await fetch(`${baseUrl}${path}`, { redirect: "follow" });
  const html = await response.text();
  const pageIssues = [];
  const title = matchContent(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const canonical = matchContent(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)
    || matchContent(html, /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  const missingAlt = imageTags.filter((tag) => !/\balt\s*=\s*["'][^"']*["']/i.test(tag)).length;
  const images = imageTags.map((tag) => matchContent(tag, /\bsrc\s*=\s*["']([^"']+)/i)).filter(Boolean).map((value) => absoluteInternalUrl(value)).filter(Boolean);
  const internalLinks = [...html.matchAll(/\bhref\s*=\s*["']([^"']+)/gi)].map((match) => match[1]).map((value) => absoluteInternalUrl(value)).filter(Boolean);

  if (response.status !== 200) pageIssues.push({ severity: "P1", area: "page", target: path, issue: `HTTP ${response.status}` });
  if (!title) pageIssues.push({ severity: "P2", area: "seo", target: path, issue: "Missing title" });
  if (title.length > 90) pageIssues.push({ severity: "P2", area: "seo", target: path, issue: `Title is ${title.length} characters` });
  if (h1Count !== 1) pageIssues.push({ severity: "P2", area: "accessibility", target: path, issue: `Expected one H1, found ${h1Count}` });
  if (!canonical) pageIssues.push({ severity: "P2", area: "seo", target: path, issue: "Missing canonical" });
  if (canonical && new URL(canonical, origin).pathname !== path) pageIssues.push({ severity: "P2", area: "seo", target: path, issue: `Canonical points to ${canonical}` });
  if (missingAlt) pageIssues.push({ severity: "P2", area: "accessibility", target: path, issue: `${missingAlt} images are missing alt attributes` });
  if (/href=["'][^"']*index\.html/i.test(html)) pageIssues.push({ severity: "P2", area: "seo", target: path, issue: "Legacy index.html internal link remains" });

  return { path, status: response.status, ms: Date.now() - started, title, canonical, internalLinks, images, issues: pageIssues };
}

async function inspectInternalLink(url) {
  const response = await fetch(url, { method: "HEAD", redirect: "follow" });
  return { url, status: response.status, ok: response.status >= 200 && response.status < 400 };
}

async function inspectImage(url) {
  const response = await fetch(url, { method: "GET", headers: { range: "bytes=0-32" }, redirect: "follow" });
  const type = response.headers.get("content-type") || "";
  return { url, status: response.status, ok: response.ok && (type.startsWith("image/") || url.includes("/api/news/cover/")) };
}

function checkSecurityHeaders(headers) {
  const required = ["content-security-policy", "x-content-type-options", "x-frame-options", "referrer-policy", "permissions-policy", "cross-origin-opener-policy"];
  if (new URL(baseUrl).protocol === "https:") required.push("strict-transport-security");
  for (const name of required) {
    if (!headers.get(name)) issues.push({ severity: "P1", area: "security", target: "/", issue: `Missing ${name}` });
  }
}

function checkContent(type, items, sitemapCount) {
  const indexableItems = items.filter((item) => item.seoIndexable !== false);
  if (indexableItems.length !== sitemapCount) issues.push({ severity: "P1", area: "data-sync", target: type, issue: `API has ${indexableItems.length} indexable published records; sitemap has ${sitemapCount}` });
  const duplicateSlugs = duplicateValues(items.map((item) => item.slug));
  if (duplicateSlugs.length) issues.push({ severity: "P1", area: "data", target: type, issue: `Duplicate slugs: ${duplicateSlugs.join(", ")}` });
  const missing = items.filter((item) => !item.slug || !item.title);
  if (missing.length) issues.push({ severity: "P1", area: "data", target: type, issue: `${missing.length} records are missing slug or title` });
}

function checkNewsTitles(items) {
  const duplicates = duplicateValues(items.map((item) => item.title));
  if (duplicates.length) issues.push({ severity: "P2", area: "news", target: "/news", issue: `${duplicates.length} duplicate published News titles` });
  for (const item of items) {
    if (String(item.title || "").length > 78) issues.push({ severity: "P2", area: "news", target: `/news/${item.slug}`, issue: `News title is ${item.title.length} characters` });
    if (String(item.seoTitle || "").length > 70) issues.push({ severity: "P2", area: "news", target: `/news/${item.slug}`, issue: `News SEO title is ${item.seoTitle.length} characters` });
  }
}

async function expectStatus(path, expected) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
  if (response.status !== expected) issues.push({ severity: "P1", area: "security", target: path, issue: `Expected HTTP ${expected}, got ${response.status}` });
  return { path, status: response.status, expected };
}

async function expectRedirect(path, destination) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
  const location = response.headers.get("location") || "";
  const actualPath = location ? new URL(location, baseUrl).pathname : "";
  if (![301, 308].includes(response.status) || actualPath !== destination) issues.push({ severity: "P2", area: "language", target: path, issue: `Expected permanent redirect to ${destination}, got ${response.status} ${location}` });
  return { path, status: response.status, location };
}

async function timedFetch(path) {
  const started = Date.now();
  const response = await fetch(`${baseUrl}${path}`, { redirect: "follow" });
  return { response, ms: Date.now() - started };
}

async function readText(path) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return { path, body: await response.text() };
}

async function readJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return { path, body: await response.json() };
}

function absoluteInternalUrl(value) {
  if (!value || /^(?:mailto:|tel:|javascript:|data:|#)/i.test(value)) return "";
  try {
    const url = new URL(value, baseUrl);
    url.hash = "";
    return url.origin === origin ? url.toString() : "";
  } catch {
    return "";
  }
}

function extractLocs(xml) {
  return [...String(xml).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replaceAll("&amp;", "&"));
}

function matchContent(value, pattern) {
  return String(value).match(pattern)?.[1]?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "";
}

function duplicateValues(values) {
  const counts = countBy(values.filter(Boolean));
  return Object.entries(counts).filter(([, count]) => count > 1).map(([value]) => value);
}

function countBy(items, key) {
  const counts = {};
  for (const item of items) {
    const value = key ? item?.[key] || "unknown" : item;
    counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      try {
        results[index] = await mapper(items[index]);
      } catch (error) {
        results[index] = { path: items[index], url: items[index], status: 0, ok: false, ms: 0, internalLinks: [], images: [], issues: [{ severity: "P1", area: "request", target: items[index], issue: error?.message || String(error) }] };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(items.length, 1)) }, worker));
  return results;
}
