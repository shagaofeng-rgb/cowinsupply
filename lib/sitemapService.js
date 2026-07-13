import fs from "node:fs/promises";
import path from "node:path";
import { getCmsItems } from "@/lib/cmsStore";
import { submitSitemapToGoogle } from "@/lib/googleSeoService";
import { getPersistentValue, hasPersistentStore, setPersistentValue } from "@/lib/persistentStore";

const WORKSPACE_ROOT = /* turbopackIgnore: true */ process.cwd();
const DATA_DIR = process.env.VERCEL ? path.join("/tmp", "cowinsupply-cms") : path.join(WORKSPACE_ROOT, ".data");
const CACHE_FILE = path.join(DATA_DIR, "sitemap-cache.json");
const LOG_FILE = path.join(DATA_DIR, "sitemap-runs.json");
const PUBLIC_DIR = path.join(WORKSPACE_ROOT, "public");
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.cowinsupply.com").replace(/\/$/, "");
const SITEMAP_LIMIT = 50000;
const MAX_XML_BYTES = 50 * 1024 * 1024;
const CONTENT_BASELINE_DATE = process.env.SITEMAP_CONTENT_BASELINE_DATE || "2026-07-10";

const STATIC_PAGES = [
  { path: "/", file: "index.html", group: "pages" },
  { path: "/product", file: "product/index.html", group: "pages" },
  { path: "/news", file: "news/index.html", group: "pages" },
  { path: "/about", file: "about/index.html", group: "pages" },
  { path: "/contact", file: "contact/index.html", group: "pages" },
  { path: "/message", file: "message/index.html", group: "pages" }
];

const GROUPS = [
  { key: "pages", filename: "sitemap-pages.xml" },
  { key: "products", filename: "sitemap-products.xml" },
  { key: "posts", filename: "sitemap-posts.xml" },
  { key: "categories", filename: "sitemap-categories.xml" }
];

export async function getSitemapIndexXml() {
  const snapshot = await getSitemapSnapshot();
  return buildSitemapIndex(snapshot.groups.filter((group) => group.urlCount > 0));
}

export async function getSitemapGroupXml(filename) {
  const group = GROUPS.find((entry) => entry.filename === filename);
  if (!group) return null;
  const snapshot = await getSitemapSnapshot();
  return snapshot.xml[group.key] || buildUrlset([]);
}

export async function getSitemapUrls() {
  const snapshot = await getSitemapSnapshot();
  return GROUPS.flatMap((group) => parseLocs(snapshot.xml[group.key] || ""));
}

export async function refreshSitemap({ trigger = "manual", submit = false, dryRun = false, verbose = false } = {}) {
  const startedAt = new Date();
  const snapshot = await buildSitemapSnapshot();
  const sizeOk = snapshot.groups.every((group) => group.urlCount <= SITEMAP_LIMIT && group.bytes <= MAX_XML_BYTES);
  const errors = sizeOk ? [] : ["sitemap-group-limit-exceeded"];
  let gscSubmit = { attempted: false, success: false, skipped: true, reason: submit ? "" : "submit-disabled" };

  if (!dryRun && !errors.length) {
    await writeJsonAtomic(CACHE_FILE, snapshot);
  }

  if (submit && !dryRun && !errors.length) {
    gscSubmit = await submitSitemapToGoogle({
      siteUrl: process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || process.env.GSC_SITE_URL || "sc-domain:cowinsupply.com",
      sitemapUrl: process.env.GOOGLE_SEARCH_CONSOLE_SITEMAP_URL || `${SITE_URL}/sitemap.xml`
    });
  }

  const log = {
    trigger,
    dryRun,
    verbose,
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
    totalUrls: snapshot.totalUrls,
    skipped: snapshot.skipped,
    groups: snapshot.groups.map(({ key, filename, urlCount, bytes }) => ({ key, filename, urlCount, bytes })),
    errors,
    gscSubmit
  };
  if (!dryRun) await appendSitemapLog(log);
  return log;
}

export async function getSitemapRuns() {
  return readJson(LOG_FILE, []);
}

async function getSitemapSnapshot() {
  const cached = await readJson(CACHE_FILE, null);
  if (cached?.xml?.pages && cached?.generatedAt) return cached;
  return buildSitemapSnapshot();
}

async function buildSitemapSnapshot() {
  const [products, news, staticPages, tagPages] = await Promise.all([
    getCmsItems("product"),
    getCmsItems("news"),
    getStaticPages(),
    getTagPages()
  ]);

  const skipped = [];
  const buckets = {
    pages: [...staticPages],
    products: products.map((item) => ({
      loc: `${SITE_URL}/product/${safePathSegment(item.slug)}.html`,
      lastmod: toDate(item.updatedAt || item.publishedAt || item.createdAt),
      source: "cms-product"
    })),
    posts: news.map((item) => ({
      loc: `${SITE_URL}/news/${safePathSegment(item.slug)}`,
      lastmod: toDate(item.updatedAt || item.publishedAt || item.createdAt),
      source: "cms-news"
    })),
    categories: tagPages
  };

  const xml = {};
  const groups = GROUPS.map((group) => {
    const urls = dedupeUrls(buckets[group.key] || [], skipped).slice(0, SITEMAP_LIMIT);
    xml[group.key] = buildUrlset(urls);
    return {
      ...group,
      urlCount: urls.length,
      bytes: Buffer.byteLength(xml[group.key], "utf8"),
      lastmod: latestLastmod(urls)
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    siteUrl: SITE_URL,
    totalUrls: groups.reduce((sum, group) => sum + group.urlCount, 0),
    skipped,
    groups,
    xml
  };
}

async function getStaticPages() {
  return Promise.all(
    STATIC_PAGES.map(async (page) => ({
      loc: `${SITE_URL}${page.path}`,
      lastmod: await fileDate(page.file),
      source: "static-page"
    }))
  );
}

async function getTagPages() {
  const tagRoot = path.join(PUBLIC_DIR, "tag");
  try {
    const entries = await fs.readdir(tagRoot, { withFileTypes: true });
    const dirs = entries.filter((entry) => entry.isDirectory()).slice(0, SITEMAP_LIMIT);
    return Promise.all(
      dirs.map(async (entry) => ({
        loc: `${SITE_URL}/tag/${safePathSegment(entry.name)}`,
        lastmod: await fileDate(path.join("tag", entry.name, "index.html")),
        source: "public-tag"
      }))
    );
  } catch {
    return [];
  }
}

function buildSitemapIndex(groups) {
  const rows = groups
    .map((group) => {
      const loc = `${SITE_URL}/sitemaps/${group.filename}`;
      const lastmod = group.lastmod || today();
      return `  <sitemap>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${escapeXml(lastmod)}</lastmod>\n  </sitemap>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</sitemapindex>\n`;
}

function buildUrlset(urls) {
  const rows = urls
    .map(
      (url) =>
        `  <url>\n    <loc>${escapeXml(url.loc)}</loc>\n    <lastmod>${escapeXml(url.lastmod || today())}</lastmod>\n  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
}

function dedupeUrls(urls, skipped) {
  const seen = new Set();
  const blocked = /\/(admin|api|login|search)(\/|$)|draft|deleted|noindex/i;
  return urls.filter((url) => {
    if (!url?.loc || blocked.test(url.loc)) {
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

async function fileDate(relativePath) {
  try {
    const stat = await fs.stat(path.join(PUBLIC_DIR, relativePath));
    const fileLastmod = stat.mtime.toISOString().slice(0, 10);
    return fileLastmod > CONTENT_BASELINE_DATE ? fileLastmod : CONTENT_BASELINE_DATE;
  } catch {
    return CONTENT_BASELINE_DATE;
  }
}

function parseLocs(xml) {
  return [...String(xml).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replaceAll("&amp;", "&"));
}

async function appendSitemapLog(entry) {
  const logs = await readJson(LOG_FILE, []);
  logs.push(entry);
  await writeJsonAtomic(LOG_FILE, logs.slice(-200));
}

async function readJson(filePath, fallbackValue) {
  if (hasPersistentStore()) {
    return (await getPersistentValue(`sitemap-${path.basename(filePath, path.extname(filePath))}`)) ?? fallbackValue;
  }
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
}

async function writeJsonAtomic(filePath, value) {
  if (hasPersistentStore()) {
    await setPersistentValue(`sitemap-${path.basename(filePath, path.extname(filePath))}`, value);
    return;
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(tempPath, filePath);
}

function safePathSegment(value) {
  return encodeURIComponent(String(value || "").trim()).replace(/%2F/gi, "-");
}

function toDate(value) {
  if (!value) return today();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return today();
  return parsed.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function latestLastmod(urls) {
  return urls.reduce((latest, url) => (url.lastmod > latest ? url.lastmod : latest), "");
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
