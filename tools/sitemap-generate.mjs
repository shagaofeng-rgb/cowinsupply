import fs from "node:fs/promises";
import path from "node:path";
import fallbackItems from "../data/cmsFallback.json" with { type: "json" };

const cwd = process.cwd();
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const submit = args.has("--submit");
const verbose = args.has("--verbose");
const force = args.has("--force");
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.cowinsupply.com").replace(/\/$/, "");
const dataDir = path.join(cwd, ".data");
const cacheFile = path.join(dataDir, "sitemap-cache.json");
const logFile = path.join(dataDir, "sitemap-runs.json");
const publicDir = path.join(cwd, "public");

const startedAt = new Date();
const snapshot = await buildSnapshot();
let gscSubmit = { attempted: false, success: false, skipped: true, reason: submit ? "" : "submit-disabled" };

if (submit && !dryRun) {
  const { submitSitemapToGoogle } = await import("../lib/googleSeoService.js");
  gscSubmit = await submitSitemapToGoogle({
    siteUrl: process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || process.env.GSC_SITE_URL || "sc-domain:cowinsupply.com",
    sitemapUrl: process.env.GOOGLE_SEARCH_CONSOLE_SITEMAP_URL || `${siteUrl}/sitemap.xml`
  });
}

const log = {
  trigger: "manual_cli",
  dryRun,
  force,
  verbose,
  startedAt: startedAt.toISOString(),
  completedAt: new Date().toISOString(),
  durationMs: Date.now() - startedAt.getTime(),
  totalUrls: snapshot.totalUrls,
  skipped: snapshot.skipped,
  groups: snapshot.groups.map(({ key, filename, urlCount, bytes }) => ({ key, filename, urlCount, bytes })),
  errors: [],
  gscSubmit
};

if (!dryRun) {
  await writeJsonAtomic(cacheFile, snapshot);
  const logs = await readJson(logFile, []);
  logs.push(log);
  await writeJsonAtomic(logFile, logs.slice(-200));
}

console.log(JSON.stringify(log, null, 2));

async function buildSnapshot() {
  const items = await readJson(path.join(dataDir, "cms-items.json"), fallbackItems);
  const products = visible(items.filter((item) => item.type === "product"));
  const news = visible(items.filter((item) => item.type === "news"));
  const tags = await getTagPages();
  const buckets = {
    pages: await getStaticPages(),
    products: products.map((item) => ({ loc: `${siteUrl}/product/${encodeURIComponent(item.slug)}.html`, lastmod: toDate(item.updatedAt || item.createdAt) })),
    posts: news.map((item) => ({ loc: `${siteUrl}/news/${encodeURIComponent(item.slug)}`, lastmod: toDate(item.publishedAt || item.updatedAt || item.createdAt) })),
    categories: tags
  };
  const groups = [
    { key: "pages", filename: "sitemap-pages.xml" },
    { key: "products", filename: "sitemap-products.xml" },
    { key: "posts", filename: "sitemap-posts.xml" },
    { key: "categories", filename: "sitemap-categories.xml" }
  ];
  const skipped = [];
  const xml = {};
  const finalGroups = groups.map((group) => {
    const urls = dedupe(buckets[group.key], skipped);
    xml[group.key] = buildUrlset(urls);
    return { ...group, urlCount: urls.length, bytes: Buffer.byteLength(xml[group.key], "utf8"), lastmod: latest(urls) };
  });
  return { generatedAt: new Date().toISOString(), siteUrl, totalUrls: finalGroups.reduce((sum, group) => sum + group.urlCount, 0), skipped, groups: finalGroups, xml };
}

async function getStaticPages() {
  const pages = [
    ["/", "index.html"],
    ["/product", "product/index.html"],
    ["/news", "news/index.html"],
    ["/about", "about/index.html"],
    ["/contact", "contact/index.html"],
    ["/message", "message/index.html"]
  ];
  return Promise.all(pages.map(async ([urlPath, file]) => ({ loc: `${siteUrl}${urlPath}`, lastmod: await fileDate(file) })));
}

async function getTagPages() {
  try {
    const entries = await fs.readdir(path.join(publicDir, "tag"), { withFileTypes: true });
    return Promise.all(entries.filter((entry) => entry.isDirectory()).map(async (entry) => ({ loc: `${siteUrl}/tag/${encodeURIComponent(entry.name)}/`, lastmod: await fileDate(path.join("tag", entry.name, "index.html")) })));
  } catch {
    return [];
  }
}

function visible(items) {
  return items.filter((item) => !["offline", "draft", "deleted"].includes(item.status));
}

function dedupe(urls, skipped) {
  const seen = new Set();
  return urls.filter((url) => {
    if (!url?.loc || /\/(admin|api|login|search)(\/|$)|draft|deleted|noindex/i.test(url.loc)) {
      skipped.push({ loc: url?.loc || "", reason: "blocked-or-empty" });
      return false;
    }
    if (seen.has(url.loc)) {
      skipped.push({ loc: url.loc, reason: "duplicate" });
      return false;
    }
    seen.add(url.loc);
    return true;
  });
}

function buildUrlset(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url>\n    <loc>${escapeXml(url.loc)}</loc>\n    <lastmod>${escapeXml(url.lastmod || today())}</lastmod>\n  </url>`).join("\n")}\n</urlset>\n`;
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) ?? fallback;
  } catch {
    return fallback;
  }
}

async function writeJsonAtomic(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(tmp, filePath);
}

async function fileDate(relativePath) {
  try {
    return (await fs.stat(path.join(publicDir, relativePath))).mtime.toISOString().slice(0, 10);
  } catch {
    return "2026-07-07";
  }
}

function toDate(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? today() : parsed.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function latest(urls) {
  return urls.reduce((value, url) => (url.lastmod > value ? url.lastmod : value), "");
}

function escapeXml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}
