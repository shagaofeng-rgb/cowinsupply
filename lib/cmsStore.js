import fs from "node:fs/promises";
import path from "node:path";
import fallbackItems from "@/data/cmsFallback.json";
import { fetchGoogleSeoData, isGoogleSeoConfigured } from "@/lib/googleSeoService";
import { getPersistentStoreStatus, getPersistentValue, hasPersistentStore, setPersistentValue } from "@/lib/persistentStore";

const WORKSPACE_ROOT = /* turbopackIgnore: true */ process.cwd();
const DATA_DIR = process.env.VERCEL ? path.join("/tmp", "cowinsupply-cms") : path.join(WORKSPACE_ROOT, ".data");
const CMS_FILE = path.join(DATA_DIR, "cms-items.json");
const INQUIRY_FILE = path.join(DATA_DIR, "inquiries.json");
const AUDIT_FILE = path.join(DATA_DIR, "audit-logs.json");
const SETTINGS_FILE = path.join(DATA_DIR, "site-settings.json");
const VISIT_FILE = path.join(DATA_DIR, "visit-events.json");
const SYNC_FILE = path.join(DATA_DIR, "sync-runs.json");
const NEWS_SOURCE_FILE = path.join(DATA_DIR, "news-sources.json");
const NEWS_JOB_FILE = path.join(DATA_DIR, "news-jobs.json");
const NEWS_AUDIT_FILE = path.join(DATA_DIR, "news-publication-audits.json");

const DEFAULT_SITE_SETTINGS = {
  siteName: "Cowin Supply",
  siteUrl: "https://www.cowinsupply.com",
  companyEmail: "davidsha@cowinsupply.com",
  defaultLanguage: "en",
  timezone: "Asia/Shanghai",
  dateFormat: "YYYY-MM-DD HH:mm:ss",
  dataRetentionDays: 365,
  syncFrequencyMinutes: 30,
  seoTitle: "Cowin Supply | Power Tools and Industrial Supplies",
  seoDescription: "Cowin Supply provides professional power tools and industrial supply products for global B2B buyers.",
  robotsPath: "/robots.txt",
  sitemapPath: "/sitemap.xml"
};

async function readJson(filePath, fallbackValue) {
  if (hasPersistentStore()) {
    const saved = await getPersistentValue(storeKey(filePath));
    return saved ?? fallbackValue;
  }
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
}

async function writeJson(filePath, value) {
  if (hasPersistentStore()) {
    await setPersistentValue(storeKey(filePath), value);
    return;
  }
  if (process.env.VERCEL) {
    throw new Error("Persistent PostgreSQL storage is required for production writes.");
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

function storeKey(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

export function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function visibleItems(items, includeInactive) {
  return includeInactive ? items : items.filter((item) => !["offline", "draft", "deleted"].includes(item.status));
}

export async function getCmsItems(type, { includeInactive = false } = {}) {
  const localItems = await readJson(CMS_FILE, []);
  const merged = localItems.length ? localItems : fallbackItems;
  let items = merged.filter((item) => item.type === type);
  return visibleItems(items, includeInactive).sort((a, b) => new Date(b.publishedAt || b.updatedAt || b.createdAt) - new Date(a.publishedAt || a.updatedAt || a.createdAt));
}

export function paginateItems(items, { page = 1, pageSize = 20, q = "", status = "" } = {}) {
  const safePageSize = [10, 20, 50, 100].includes(Number(pageSize)) ? Number(pageSize) : 20;
  const safePage = Math.max(1, Number(page) || 1);
  const keyword = String(q || "").trim().toLowerCase();
  const wantedStatus = String(status || "").trim();
  const filtered = items.filter((item) => {
    const haystack = [
      item.title,
      item.category,
      item.slug,
      item.name,
      item.company,
      item.email,
      item.phone,
      item.product,
      item.source,
      item.message,
      item.path,
      item.page
    ].join(" ").toLowerCase();
    return (!keyword || haystack.includes(keyword)) && (!wantedStatus || item.status === wantedStatus);
  });
  const total = filtered.length;
  const start = (safePage - 1) * safePageSize;
  return { items: filtered.slice(start, start + safePageSize), total, page: safePage, pageSize: safePageSize };
}

export async function saveCmsItem(input) {
  const now = new Date().toISOString();
  const slug = input.slug || slugify(input.title);
  const normalized = {
    id: input.id || `${input.type}-${slug}`,
    type: input.type,
    slug,
    title: String(input.title || "").trim(),
    category: String(input.category || "").trim(),
    image: String(input.image || "").trim(),
    summary: String(input.summary || "").trim(),
    status: input.status || "published",
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
    ...(input.type === "news"
      ? {
          language: input.language || "en",
          content: input.content || "",
          authorName: input.authorName || "Cowin Supply Editorial",
          publishedAt: input.publishedAt || (input.status === "published" ? now : ""),
          scheduledAt: input.scheduledAt || "",
          seoTitle: input.seoTitle || input.title,
          seoDescription: input.seoDescription || input.summary,
          canonicalUrl: input.canonicalUrl || `https://www.cowinsupply.com/news/${slug}`,
          primaryKeyword: input.primaryKeyword || "",
          secondaryKeywords: input.secondaryKeywords || [],
          geoSummary: input.geoSummary || "",
          keyTakeaways: input.keyTakeaways || [],
          sourceTitle: input.sourceTitle || "",
          sourceAuthor: input.sourceAuthor || "",
          sourcePublisher: input.sourcePublisher || "",
          sourceUrl: input.sourceUrl || "",
          canonicalSourceUrl: input.canonicalSourceUrl || "",
          sourceLanguage: input.sourceLanguage || "en",
          sourcePublishedAt: input.sourcePublishedAt || "",
          sourceFetchedAt: input.sourceFetchedAt || "",
          sourceTimezone: input.sourceTimezone || "UTC",
          sourceFingerprint: input.sourceFingerprint || "",
          eventFingerprint: input.eventFingerprint || "",
          contentHash: input.contentHash || "",
          relevanceScore: Number(input.relevanceScore || 0),
          credibilityScore: Number(input.credibilityScore || 0),
          generationModel: input.generationModel || "rule-based-summary",
          generationPromptVersion: input.generationPromptVersion || "news-auto-v1",
          relatedProducts: Array.isArray(input.relatedProducts) ? input.relatedProducts : [],
          originalFacts: input.originalFacts || "",
          ourAnalysis: input.ourAnalysis || "",
          customerImpact: input.customerImpact || "",
          ourHelp: input.ourHelp || "",
          faq: Array.isArray(input.faq) ? input.faq : [],
          coverImageSourceUrl: input.coverImageSourceUrl || "",
          coverImagePageUrl: input.coverImagePageUrl || input.sourceUrl || "",
          coverImageAlt: input.coverImageAlt || input.title,
          coverImageStatus: input.coverImageStatus || "generated"
        }
      : {})
  };
  const existing = await readJson(CMS_FILE, []);
  const seed = existing.length ? existing : fallbackItems;
  const next = seed.filter((item) => !(item.type === normalized.type && item.slug === normalized.slug));
  next.push(normalized);
  await writeJson(CMS_FILE, next);
  return normalized;
}

export async function getNewsSources({ includeDisabled = false } = {}) {
  const saved = await readJson(NEWS_SOURCE_FILE, []);
  const configured = parseNewsSourcesFromEnv();
  const sources = saved.length ? saved : configured;
  return sources.filter((source) => includeDisabled || source.enabled !== false);
}

export async function saveNewsSources(sources) {
  await writeJson(NEWS_SOURCE_FILE, sources);
  return sources;
}

export async function appendNewsJob(input) {
  const jobs = await readJson(NEWS_JOB_FILE, []);
  const job = {
    id: input.id || crypto.randomUUID(),
    jobType: input.jobType || input.job_type || "collect_publish",
    status: input.status || "success",
    scheduledAt: input.scheduledAt || input.scheduled_at || "",
    startedAt: input.startedAt || input.started_at || new Date().toISOString(),
    completedAt: input.completedAt || input.completed_at || new Date().toISOString(),
    retryCount: Number(input.retryCount || input.retry_count || 0),
    errorMessage: input.errorMessage || input.error_message || "",
    metadata: input.metadata || {}
  };
  jobs.push(job);
  await writeJson(NEWS_JOB_FILE, jobs.slice(-500));
  return job;
}

export async function getNewsJobs() {
  return (await readJson(NEWS_JOB_FILE, [])).sort((a, b) => new Date(b.startedAt || b.createdAt) - new Date(a.startedAt || a.createdAt));
}

export async function appendNewsPublicationAudit(input) {
  const audits = await readJson(NEWS_AUDIT_FILE, []);
  const audit = {
    id: input.id || crypto.randomUUID(),
    date: input.date || new Date().toISOString().slice(0, 10),
    timezone: input.timezone || process.env.NEWS_TIMEZONE || "Asia/Shanghai",
    targetCount: Number(input.targetCount || process.env.NEWS_DAILY_TARGET || 4),
    publishedCount: Number(input.publishedCount || 0),
    missingCount: Number(input.missingCount || 0),
    status: input.status || "checked",
    checkedAt: input.checkedAt || new Date().toISOString(),
    message: input.message || ""
  };
  audits.push(audit);
  await writeJson(NEWS_AUDIT_FILE, audits.slice(-500));
  return audit;
}

export async function getNewsPublicationAudits() {
  return (await readJson(NEWS_AUDIT_FILE, [])).sort((a, b) => new Date(b.checkedAt) - new Date(a.checkedAt));
}

export async function getPublishedNewsCountForDate(dateKey, timezone = process.env.NEWS_TIMEZONE || "Asia/Shanghai") {
  const news = await getCmsItems("news", { includeInactive: true });
  return news.filter((item) => item.status === "published" && dateInTimezone(item.publishedAt || item.updatedAt || item.createdAt, timezone) === dateKey).length;
}

export async function updateCmsItemStatus(type, slug, status) {
  const existing = await readJson(CMS_FILE, []);
  const seed = existing.length ? existing : fallbackItems;
  await writeJson(
    CMS_FILE,
    seed.map((item) => (item.type === type && item.slug === slug ? { ...item, status, updatedAt: new Date().toISOString() } : item))
  );
}

export async function deleteCmsItem(type, slug) {
  await updateCmsItemStatus(type, slug, "deleted");
}

export async function getInquiries() {
  return (await readJson(INQUIRY_FILE, [])).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function updateInquiryStatus(id, status) {
  const items = await readJson(INQUIRY_FILE, []);
  await writeJson(
    INQUIRY_FILE,
    items.map((item) => (item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item))
  );
}

export async function saveInquiry(input) {
  const inquiry = {
    id: crypto.randomUUID(),
    name: String(input.name || "").trim(),
    email: String(input.email || "").trim(),
    phone: String(input.phone || "").trim(),
    company: String(input.company || "").trim(),
    product: String(input.product || "").trim(),
    message: String(input.message || "").trim(),
    country: String(input.country || "").trim(),
    pageUrl: String(input.pageUrl || input.url || "").trim(),
    utmSource: String(input.utm_source || input.utmSource || "").trim(),
    utmMedium: String(input.utm_medium || input.utmMedium || "").trim(),
    utmCampaign: String(input.utm_campaign || input.utmCampaign || "").trim(),
    source: String(input.source || "website").trim(),
    status: "new",
    createdAt: new Date().toISOString()
  };
  const items = await readJson(INQUIRY_FILE, []);
  items.push(inquiry);
  await writeJson(INQUIRY_FILE, items);
  return inquiry;
}

export async function appendAuditLog(input) {
  const logs = await readJson(AUDIT_FILE, []);
  const entry = {
    id: crypto.randomUUID(),
    actor: input.actor || "system",
    action: input.action || "unknown",
    module: input.module || "system",
    target: input.target || "",
    result: input.result || "success",
    createdAt: new Date().toISOString()
  };
  logs.push(entry);
  await writeJson(AUDIT_FILE, logs.slice(-1000));
  return entry;
}

export async function getAuditLogs() {
  return (await readJson(AUDIT_FILE, [])).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getSiteSettings() {
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...(await readJson(SETTINGS_FILE, {})),
    smtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD),
    adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL || DEFAULT_SITE_SETTINGS.companyEmail
  };
}

export async function saveSiteSettings(input) {
  const current = await getSiteSettings();
  const next = {
    siteName: String(input.siteName || current.siteName).trim(),
    siteUrl: String(input.siteUrl || current.siteUrl).trim(),
    companyEmail: String(input.companyEmail || current.companyEmail).trim(),
    defaultLanguage: String(input.defaultLanguage || current.defaultLanguage).trim(),
    timezone: String(input.timezone || current.timezone).trim(),
    dateFormat: String(input.dateFormat || current.dateFormat).trim(),
    dataRetentionDays: Number(input.dataRetentionDays || current.dataRetentionDays),
    syncFrequencyMinutes: Number(input.syncFrequencyMinutes || current.syncFrequencyMinutes),
    seoTitle: String(input.seoTitle || current.seoTitle).trim(),
    seoDescription: String(input.seoDescription || current.seoDescription).trim(),
    robotsPath: String(input.robotsPath || current.robotsPath).trim(),
    sitemapPath: String(input.sitemapPath || current.sitemapPath).trim(),
    updatedAt: new Date().toISOString()
  };
  await writeJson(SETTINGS_FILE, next);
  return next;
}

export async function getCategorySummary() {
  const [products, news] = await Promise.all([getCmsItems("product", { includeInactive: true }), getCmsItems("news", { includeInactive: true })]);
  const map = new Map();
  [...products, ...news].forEach((item) => {
    const name = item.category || "未分类";
    const value = map.get(name) || { name, products: 0, news: 0, published: 0, total: 0 };
    value[item.type === "product" ? "products" : "news"] += 1;
    value.published += item.status === "published" ? 1 : 0;
    value.total += 1;
    map.set(name, value);
  });
  return [...map.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

export async function getMediaAssets({ limit = 120 } = {}) {
  const roots = [path.join(WORKSPACE_ROOT, "public", "cowin-assets"), path.join(WORKSPACE_ROOT, "public", "homepage-redesign", "assets")];
  const allowed = new Set([".jpg", ".jpeg", ".png", ".webp", ".svg"]);
  const assets = [];
  for (const root of roots) {
    try {
      const entries = await fs.readdir(root, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const ext = path.extname(entry.name).toLowerCase();
        if (!allowed.has(ext)) continue;
        const fullPath = path.join(root, entry.name);
        const stat = await fs.stat(fullPath);
        assets.push({
          name: entry.name,
          path: `/${path.relative(path.join(WORKSPACE_ROOT, "public"), fullPath).replaceAll(path.sep, "/")}`,
          type: ext.replace(".", "").toUpperCase(),
          size: stat.size,
          updatedAt: stat.mtime.toISOString()
        });
      }
    } catch {
      // Missing folders are acceptable.
    }
  }
  return assets.sort((a, b) => b.size - a.size).slice(0, limit);
}

export async function saveVisitEvent(input) {
  const events = await readJson(VISIT_FILE, []);
  const event = {
    id: crypto.randomUUID(),
    path: normalizePath(input.path || "/"),
    title: String(input.title || "").slice(0, 180),
    referrer: String(input.referrer || "").slice(0, 500),
    source: detectSource(input.referrer),
    userAgent: String(input.userAgent || "").slice(0, 500),
    device: detectDevice(input.userAgent),
    language: String(input.language || "").slice(0, 40),
    country: String(input.country || "").slice(0, 80),
    screen: String(input.screen || "").slice(0, 40),
    visitorId: String(input.visitorId || "").slice(0, 120),
    sessionId: String(input.sessionId || "").slice(0, 120),
    createdAt: new Date().toISOString()
  };
  events.push(event);
  await writeJson(VISIT_FILE, events.slice(-5000));
  return event;
}

export async function getVisitEvents() {
  return (await readJson(VISIT_FILE, [])).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getAnalyticsReport() {
  const [events, products, news, inquiries] = await Promise.all([
    getVisitEvents(),
    getCmsItems("product", { includeInactive: true }),
    getCmsItems("news", { includeInactive: true }),
    getInquiries()
  ]);
  const visitors = new Set(events.map((event) => event.visitorId || event.sessionId || event.id));
  return {
    pv: events.length,
    uv: visitors.size,
    productViews: events.filter((event) => event.path.includes("/product")).length,
    newsViews: events.filter((event) => event.path.includes("/news")).length,
    inquiries: inquiries.length,
    conversionRate: events.length ? Number(((inquiries.length / events.length) * 100).toFixed(2)) : 0,
    products: products.length,
    news: news.length,
    sources: topBy(events, "source", 8),
    devices: topBy(events, "device", 8),
    countries: topBy(events, "country", 8),
    topPages: topBy(events, "path", 10),
    recent: events.slice(0, 100),
    daily: buildDailySeries(events)
  };
}

export async function getSeoReport() {
  const [products, news, settings, gsc] = await Promise.all([
    getCmsItems("product"),
    getCmsItems("news"),
    getSiteSettings(),
    fetchGoogleSeoData()
  ]);
  const pages = [
    { title: "首页", url: "/", type: "页面", summary: settings.seoDescription },
    ...products.map((item) => ({ title: item.title, url: `/product/${item.slug}.html`, type: "产品", summary: item.summary })),
    ...news.map((item) => ({ title: item.title, url: `/news/${item.slug}`, type: "新闻", summary: item.summary }))
  ];
  const issues = pages.flatMap((page) => {
    const list = [];
    if (!page.title) list.push({ level: "高", issue: "缺少 SEO 标题", page: page.url });
    if (!page.summary || /^Cowin Supply (product|news) page\.$/.test(page.summary)) {
      list.push({ level: "中", issue: "SEO 描述需要补充", page: page.url });
    }
    return list;
  });
  return {
    gscConfigured: gsc.configured || isGoogleSeoConfigured(),
    gscConnected: Boolean(gsc.connected),
    gscSiteUrl: gsc.siteUrl || process.env.GSC_SITE_URL || "sc-domain:cowinsupply.com",
    gscError: gsc.error || null,
    clicks: gsc.clicks || 0,
    impressions: gsc.impressions || 0,
    ctr: gsc.ctr || 0,
    position: gsc.position || 0,
    pages,
    issues,
    keywords: gsc.keywords || [],
    landingPages: gsc.landingPages || [],
    markets: gsc.markets || []
  };
}

export async function getLinkAudit() {
  const [products, news] = await Promise.all([getCmsItems("product"), getCmsItems("news")]);
  return {
    internal: [
      { from: "/", to: "/product", anchor: "Products", status: "已发现" },
      { from: "/", to: "/news", anchor: "News", status: "已发现" },
      ...products.map((item) => ({ from: "/product", to: `/product/${item.slug}.html`, anchor: item.title, status: "已发现" })),
      ...news.map((item) => ({ from: "/news", to: `/news/${item.slug}`, anchor: item.title, status: "已发现" }))
    ],
    external: [],
    broken: [],
    orphanPages: []
  };
}

export async function getPagePerformance() {
  const analytics = await getAnalyticsReport();
  return analytics.topPages.map((item) => ({
    path: item.key,
    pv: item.count,
    uv: new Set(analytics.recent.filter((event) => event.path === item.key).map((event) => event.visitorId || event.id)).size,
    avgStay: 0,
    bounceRate: 0,
    conversion: 0
  }));
}

export async function getVisitPaths() {
  const events = await getVisitEvents();
  const bySession = new Map();
  events
    .slice()
    .reverse()
    .forEach((event) => {
      const key = event.sessionId || event.visitorId || event.id;
      const list = bySession.get(key) || [];
      list.push(event.path);
      bySession.set(key, list);
    });
  return [...bySession.entries()].map(([sessionId, paths]) => ({ sessionId, paths: [...new Set(paths)] })).slice(0, 50);
}

export async function appendSyncRun(input) {
  const runs = await readJson(SYNC_FILE, []);
  const run = {
    id: crypto.randomUUID(),
    source: input.source || "manual",
    status: input.status || "success",
    processed: Number(input.processed || 0),
    message: input.message || "",
    createdAt: new Date().toISOString()
  };
  runs.push(run);
  await writeJson(SYNC_FILE, runs.slice(-500));
  return run;
}

export async function getSyncStatus() {
  const runs = await readJson(SYNC_FILE, []);
  const newsJobs = await getNewsJobs();
  const audits = await getNewsPublicationAudits();
  return {
    trackingConfigured: true,
    gscConfigured: isGoogleSeoConfigured(),
    gaConfigured: Boolean(process.env.GA_PROPERTY_ID),
    cronConfigured: true,
    newsAutomationConfigured: true,
    newsSourcesConfigured: (await getNewsSources()).length,
    lastNewsJob: newsJobs[0] || null,
    latestNewsAudit: audits[0] || null,
    lastRun: runs.at(-1) || null,
    runs: runs.slice(-50).reverse()
  };
}

export async function getSystemStatus() {
  const [products, news, inquiries, logs, settings, media, analytics, sync] = await Promise.all([
    getCmsItems("product", { includeInactive: true }),
    getCmsItems("news", { includeInactive: true }),
    getInquiries(),
    getAuditLogs(),
    getSiteSettings(),
    getMediaAssets({ limit: 500 }),
    getAnalyticsReport(),
    getSyncStatus()
  ]);
  const persistence = getPersistentStoreStatus();
  return {
    siteUrl: settings.siteUrl,
    nodeEnv: process.env.NODE_ENV || "development",
    isVercel: Boolean(process.env.VERCEL),
    deploymentUrl: process.env.VERCEL_URL || "",
    dataStore: persistence.configured ? persistence.provider : process.env.VERCEL ? "未配置持久化数据库（只读回退）" : "本地 .data 文件存储",
    persistentStoreConfigured: persistence.configured,
    smtpConfigured: settings.smtpConfigured,
    trackingConfigured: sync.trackingConfigured,
    gscConfigured: sync.gscConfigured,
    counts: {
      products: products.length,
      news: news.length,
      inquiries: inquiries.length,
      auditLogs: logs.length,
      media: media.length,
      pv: analytics.pv,
      uv: analytics.uv
    },
    checkedAt: new Date().toISOString()
  };
}

function parseNewsSourcesFromEnv() {
  const whitelist = String(process.env.NEWS_SOURCE_WHITELIST || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const feeds = String(process.env.NEWS_SOURCE_FEEDS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return feeds.map((rssUrl, index) => {
    let hostname = "";
    try {
      hostname = new URL(rssUrl).hostname.replace(/^www\./, "");
    } catch {
      hostname = `source-${index + 1}`;
    }
    return {
      id: `rss-${slugify(hostname) || index + 1}`,
      domain: hostname,
      publisherName: hostname,
      sourceType: "rss",
      rssUrl,
      language: "en",
      country: "global",
      credibilityScore: whitelist.length && !whitelist.includes(hostname) ? 55 : 80,
      enabled: true,
      allowedForAutoPublish: true,
      lastFetchedAt: "",
      failureCount: 0
    };
  });
}

function dateInTimezone(value, timezone) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
  } catch {
    return String(value).slice(0, 10);
  }
}

export async function getAdminSummary() {
  const [products, news, inquiries, media, categories, analytics] = await Promise.all([
    getCmsItems("product", { includeInactive: true }),
    getCmsItems("news", { includeInactive: true }),
    getInquiries(),
    getMediaAssets(),
    getCategorySummary(),
    getAnalyticsReport()
  ]);
  return {
    products: products.length,
    news: news.length,
    inquiries: inquiries.length,
    media: media.length,
    categories: categories.length,
    pv: analytics.pv,
    uv: analytics.uv,
    newInquiries: inquiries.filter((item) => item.status === "new").length,
    lastUpdated: new Date().toISOString()
  };
}

function normalizePath(value) {
  try {
    return new URL(String(value), "https://www.cowinsupply.com").pathname || "/";
  } catch {
    return "/";
  }
}

function detectSource(referrer) {
  const value = String(referrer || "").toLowerCase();
  if (!value) return "直接访问";
  if (value.includes("google") || value.includes("bing") || value.includes("yahoo")) return "搜索";
  if (value.includes("facebook") || value.includes("linkedin") || value.includes("youtube") || value.includes("x.com")) return "社媒";
  if (value.includes("cowinsupply.com")) return "站内";
  return "外部链接";
}

function detectDevice(userAgent) {
  const value = String(userAgent || "").toLowerCase();
  if (/mobile|iphone|android/.test(value)) return "手机";
  if (/ipad|tablet/.test(value)) return "平板";
  if (!value) return "未知";
  return "桌面";
}

function topBy(items, key, limit = 10) {
  const map = new Map();
  items.forEach((item) => {
    const value = item[key] || "未知";
    map.set(value, (map.get(value) || 0) + 1);
  });
  return [...map.entries()].map(([keyName, count]) => ({ key: keyName, count })).sort((a, b) => b.count - a.count).slice(0, limit);
}

function buildDailySeries(events) {
  const days = [];
  for (let index = 6; index >= 0; index -= 1) {
    const day = new Date();
    day.setDate(day.getDate() - index);
    const key = day.toISOString().slice(5, 10);
    const dayEvents = events.filter((event) => event.createdAt?.slice(5, 10) === key);
    days.push({ day: key, pv: dayEvents.length, uv: new Set(dayEvents.map((event) => event.visitorId || event.id)).size });
  }
  return days;
}
