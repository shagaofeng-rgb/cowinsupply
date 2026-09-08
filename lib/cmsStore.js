import fs from "node:fs/promises";
import path from "node:path";
import fallbackItems from "@/data/cmsFallback.json";
import legacyProducts from "@/data/legacyProducts.json";
import { fetchGoogleSeoData, isGoogleSeoConfigured } from "@/lib/googleSeoService";
import {
  appendPersistentInquiryActivity,
  appendPersistentInquiryNotification,
  getOperationalStoreMigration,
  getPersistentInquiry,
  getPersistentStoreStatus,
  getPersistentValue,
  hasPersistentStore,
  insertPersistentVisitEvent,
  listPersistentInquiries,
  listPersistentInquiryActivities,
  listPersistentInquiryNotifications,
  listPersistentVisitEvents,
  queryPersistentInquiries,
  queryPersistentVisitEvents,
  setOperationalStoreMigration,
  setPersistentValue,
  updatePersistentInquiry,
  upsertPersistentInquiry
} from "@/lib/persistentStore";
import { SEO_CLEANUP_VERSION, contentCleanupPlan } from "@/lib/seoContentPolicy";
import { normalizeCompanyText } from "@/lib/brandText";

const WORKSPACE_ROOT = /* turbopackIgnore: true */ process.cwd();
const DATA_DIR = process.env.VERCEL ? path.join("/tmp", "cowinsupply-cms") : path.join(WORKSPACE_ROOT, ".data");
const CMS_FILE = path.join(DATA_DIR, "cms-items.json");
const INQUIRY_FILE = path.join(DATA_DIR, "inquiries.json");
const AUDIT_FILE = path.join(DATA_DIR, "audit-logs.json");
const SETTINGS_FILE = path.join(DATA_DIR, "site-settings.json");
const VISIT_FILE = path.join(DATA_DIR, "visit-events.json");
const SYNC_FILE = path.join(DATA_DIR, "sync-runs.json");

const DEFAULT_SITE_SETTINGS = {
  siteName: "Cowin Supply",
  siteUrl: "https://www.cowinsupply.com",
  companyEmail: "davidsha@cowinsupply.com",
  companyPhone: "+8617601255205",
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

let operationalMigrationPromise;

async function ensureOperationalStoreMigration() {
  if (!hasPersistentStore()) return;
  operationalMigrationPromise ||= (async () => {
    if (await getOperationalStoreMigration()) return;
    const [legacyInquiries, legacyVisits] = await Promise.all([
      getPersistentValue("inquiries"),
      getPersistentValue("visit-events")
    ]);
    const inquiries = Array.isArray(legacyInquiries) ? legacyInquiries : [];
    const visits = Array.isArray(legacyVisits) ? legacyVisits : [];
    await setPersistentValue("operational-store-migration-v1-backup", {
      createdAt: new Date().toISOString(),
      inquiries,
      visits
    });
    for (const inquiry of inquiries) {
      if (inquiry?.id) await upsertPersistentInquiry(inquiry);
    }
    for (const event of visits) {
      if (event?.id) await insertPersistentVisitEvent(event);
    }
    await setOperationalStoreMigration({
      version: 1,
      completedAt: new Date().toISOString(),
      inquiryCount: inquiries.length,
      visitCount: visits.length
    });
  })();
  await operationalMigrationPromise;
}


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
  await applySeoCleanupIfNeeded();
  const localItems = await readJson(CMS_FILE, []);
  const merged = localItems.length ? localItems : [...fallbackItems.filter((item) => item.type !== "product"), ...legacyProducts];
  const materialized = hasPersistentStore() ? merged : contentCleanupPlan(merged).nextItems;
  let items = materialized.filter((item) => item.type === type).map(normalizeCmsItemText).map(normalizeNewsPresentation);
  return visibleItems(items, includeInactive).sort((a, b) => new Date(b.publishedAt || b.updatedAt || b.createdAt) - new Date(a.publishedAt || a.updatedAt || a.createdAt));
}

function normalizeCmsItemText(value) {
  if (typeof value === "string") return normalizeEditorialText(normalizeCompanyText(value));
  if (Array.isArray(value)) return value.map(normalizeCmsItemText);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeCmsItemText(entry)]));
  }
  return value;
}

function normalizeEditorialText(value) {
  return String(value)
    .replaceAll("&amp;ldquo;", '"')
    .replaceAll("&amp;rdquo;", '"')
    .replaceAll("&ldquo;", '"')
    .replaceAll("&rdquo;", '"')
    .replaceAll("鈥", "...")
    .replaceAll("鈥?", '"');
}

function normalizeNewsPresentation(item) {
  if (item?.type !== "news" || !item.title) return item;
  const title = String(item.title);
  const normalizedTitle = title ? `${title[0].toUpperCase()}${title.slice(1)}` : title;
  return {
    ...item,
    title: normalizedTitle,
    seoTitle: item.seoTitle ? `${String(item.seoTitle)[0].toUpperCase()}${String(item.seoTitle).slice(1)}` : item.seoTitle
  };
}

export async function getSeoGoneUrls() {
  return hasPersistentStore() ? (await getPersistentValue("seo-gone-urls")) || [] : [];
}

async function applySeoCleanupIfNeeded() {
  if (!hasPersistentStore()) return;
  if ((await getPersistentValue("seo-cleanup-version")) === SEO_CLEANUP_VERSION) return;
  const existing = await readJson(CMS_FILE, []);
  if (!Array.isArray(existing) || !existing.length) return;
  const plan = contentCleanupPlan(existing);
  const goneUrls = [
    ...plan.deletedNews.map((item) => `/news/${item.slug}`),
    ...plan.deletedBlog.map((item) => `/blog/${item.slug}`)
  ];
  await setPersistentValue("cms-items-before-product-technical-data-v5", existing);
  await writeJson(CMS_FILE, plan.nextItems);
  await setPersistentValue("seo-gone-urls", goneUrls);
  await setPersistentValue("seo-cleanup-version", SEO_CLEANUP_VERSION);
  await setPersistentValue("seo-cleanup-log", {
    version: SEO_CLEANUP_VERSION,
    completedAt: new Date().toISOString(),
    deletedNews: plan.deletedNews.map((item) => ({ id: item.id, slug: item.slug, title: item.title })),
    deletedBlog: plan.deletedBlog.map((item) => ({ id: item.id, slug: item.slug, title: item.title })),
    createdBlog: plan.guides.map((item) => ({ id: item.id, slug: item.slug, title: item.title }))
  });
}

export function paginateItems(items, { page = 1, pageSize = 20, q = "", status = "", from = "", to = "" } = {}) {
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
      item.sessionId,
      item.identity,
      Array.isArray(item.paths) ? item.paths.join(" ") : "",
      item.source,
      item.message,
      item.path,
      item.page
    ].join(" ").toLowerCase();
    const itemDate = dateInTimezone(item.updatedAt || item.publishedAt || item.createdAt, "Asia/Shanghai");
    const inRange = (!from || itemDate >= from) && (!to || itemDate <= to);
    return (!keyword || haystack.includes(keyword)) && (!wantedStatus || item.status === wantedStatus) && inRange;
  });
  const total = filtered.length;
  const start = (safePage - 1) * safePageSize;
  return { items: filtered.slice(start, start + safePageSize), total, page: safePage, pageSize: safePageSize };
}

export async function saveCmsItem(input) {
  const now = new Date().toISOString();
  const slug = input.slug || slugify(input.title);
  const existing = await readJson(CMS_FILE, []);
  const seed = existing.length ? existing : fallbackItems;
  const previous = seed.find((item) => item.type === input.type && item.slug === slug);
  const normalized = {
    ...previous,
    id: input.id || previous?.id || `${input.type}-${slug}`,
    type: input.type,
    slug,
    title: String(input.title || "").trim(),
    category: String(input.category || "").trim(),
    image: String(input.image ?? previous?.image ?? "").trim(),
    summary: String(input.summary ?? previous?.summary ?? "").trim(),
    status: input.status || previous?.status || "published",
    createdAt: input.createdAt || previous?.createdAt || now,
    updatedAt: now,
    ...(input.type === "product"
      ? {
          model: String(input.model ?? previous?.model ?? "").trim(),
          categorySlug: String(input.categorySlug ?? previous?.categorySlug ?? "").trim(),
          gallery: Array.isArray(input.gallery) ? input.gallery.filter(Boolean) : (previous?.gallery || []),
          legacySourceUrl: input.legacySourceUrl ?? previous?.legacySourceUrl ?? "",
          legacyDescriptionHtml: input.legacyDescriptionHtml ?? previous?.legacyDescriptionHtml ?? "",
          publishedAt: input.publishedAt || previous?.publishedAt || (input.status === "published" ? now : ""),
          seoTitle: input.seoTitle || previous?.seoTitle || input.title,
          seoDescription: input.seoDescription || previous?.seoDescription || input.summary,
          canonicalUrl: input.canonicalUrl || previous?.canonicalUrl || `https://www.cowinsupply.com/product/${slug}.html`,
          primaryKeyword: input.primaryKeyword || previous?.primaryKeyword || input.title,
          secondaryKeywords: Array.isArray(input.secondaryKeywords) ? input.secondaryKeywords : (previous?.secondaryKeywords || []),
          tags: Array.isArray(input.tags) ? input.tags : (previous?.tags || []),
          geoSummary: input.geoSummary || previous?.geoSummary || input.summary,
          applications: Array.isArray(input.applications) ? input.applications : (previous?.applications || []),
          features: Array.isArray(input.features) ? input.features : (previous?.features || []),
          specifications: Array.isArray(input.specifications) ? input.specifications : (previous?.specifications || []),
          faq: Array.isArray(input.faq) ? input.faq : (previous?.faq || []),
          relatedProducts: Array.isArray(input.relatedProducts) ? input.relatedProducts : (previous?.relatedProducts || []),
          relatedArticles: Array.isArray(input.relatedArticles) ? input.relatedArticles : (previous?.relatedArticles || []),
          parameterStatus: input.parameterStatus || previous?.parameterStatus || "pending-confirmation",
          seoIndexable: input.seoIndexable ?? previous?.seoIndexable ?? false
        }
      : input.type === "news"
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
          coverImageStatus: input.coverImageStatus || "generated",
          imageLicenseNote: input.imageLicenseNote || "",
          automationVersion: input.automationVersion || previous?.automationVersion || "",
          automationCandidateId: input.automationCandidateId || previous?.automationCandidateId || "",
          editorialStatus: input.editorialStatus || previous?.editorialStatus || "",
          googleSubmission: input.googleSubmission || previous?.googleSubmission || null
        }
      : input.type === "blog"
      ? {
          language: input.language || "en",
          content: input.content || "",
          authorId: input.authorId || input.author_id || "",
          authorName: input.authorName || input.author_id || "Cowin Supply",
          publishedAt: input.publishedAt || (input.status === "published" ? now : ""),
          seoTitle: input.seoTitle || input.title,
          seoDescription: input.seoDescription || input.summary,
          canonicalUrl: input.canonicalUrl || `https://www.cowinsupply.com/blog/${slug}`,
          primaryKeyword: input.primaryKeyword || input.title,
          secondaryKeywords: Array.isArray(input.secondaryKeywords) ? input.secondaryKeywords : [],
          geoSummary: input.geoSummary || input.summary,
          coverImageAlt: input.coverImageAlt || input.title,
          webhookClassId: input.webhookClassId || input.class_id || "blog",
          contentHash: input.contentHash || "",
          webhookContentHash: input.webhookContentHash || previous?.webhookContentHash || "",
          webhookSource: input.webhookSource || previous?.webhookSource || ""
        }
      : {})
  };
  const next = seed.filter((item) => !(item.type === normalized.type && item.slug === normalized.slug));
  if (previous?.type === "product") {
    next.push({ id: `product-version-${crypto.randomUUID()}`, type: "product-version", productSlug: slug, snapshot: previous, createdAt: now });
  }
  next.push(normalized);
  await writeJson(CMS_FILE, next);
  return normalized;
}

export async function replaceCmsItems(type, items) {
  if (!['product', 'news', 'blog'].includes(type)) throw new Error('Unsupported CMS content type');
  const existing = await readJson(CMS_FILE, []);
  const seed = existing.length ? existing : fallbackItems;
  const retained = seed.filter((item) => item.type !== type);
  const normalized = items.map((item) => ({ ...item, type, status: item.status || 'published' }));
  await writeJson(CMS_FILE, [...retained, ...normalized]);
  return normalized;
}

export async function updateCmsItemStatus(type, slug, status) {
  const existing = await readJson(CMS_FILE, []);
  const seed = existing.length ? existing : fallbackItems;
  const now = new Date().toISOString();
  const target = seed.find((item) => item.type === type && item.slug === slug);
  const next = seed.map((item) => (item.type === type && item.slug === slug ? { ...item, status, updatedAt: now } : item));
  if (target?.type === "product") next.push({ id: `product-version-${crypto.randomUUID()}`, type: "product-version", productSlug: slug, snapshot: target, createdAt: now });
  await writeJson(CMS_FILE, next);
}

export async function getProductVersions(slug) {
  const items = await readJson(CMS_FILE, []);
  return items.filter((item) => item.type === "product-version" && item.productSlug === slug).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function restoreProductVersion(slug, versionId) {
  const versions = await getProductVersions(slug);
  const version = versions.find((item) => item.id === versionId);
  if (!version?.snapshot) throw new Error("Product version not found");
  return saveCmsItem({ ...version.snapshot, slug, type: "product" });
}

export async function deleteCmsItem(type, slug) {
  await updateCmsItemStatus(type, slug, "deleted");
}

export async function getInquiries() {
  await ensureOperationalStoreMigration();
  if (hasPersistentStore()) return (await listPersistentInquiries()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return (await readJson(INQUIRY_FILE, [])).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getInquiriesPage(input = {}) {
  await ensureOperationalStoreMigration();
  if (hasPersistentStore()) return queryPersistentInquiries(input);
  return paginateItems(await getInquiries(), input);
}

export async function getInquiryDetail(id) {
  await ensureOperationalStoreMigration();
  const inquiry = hasPersistentStore() ? await getPersistentInquiry(id) : (await getInquiries()).find((item) => item.id === id);
  if (!inquiry) return null;
  return buildInquiryDetail(inquiry);
}

export async function getInquiryDetails(ids = []) {
  const details = await Promise.all(ids.filter(Boolean).map(async (id) => [id, await getInquiryDetail(id)]));
  return new Map(details.filter(([, detail]) => detail));
}

async function buildInquiryDetail(inquiry) {
  const [allInquiries, allEvents, activities, notifications] = await Promise.all([
    getInquiries(),
    getVisitEvents(),
    getInquiryActivities(inquiry.id),
    getInquiryNotifications(inquiry.id)
  ]);
  const relatedInquiries = collectCustomerInquiries(inquiry, allInquiries);
  const identities = customerIdentitySet(relatedInquiries);
  const journey = allEvents.filter((event) => identities.visitorIds.has(String(event.visitorId || "")) || identities.sessionIds.has(String(event.sessionId || "")));
  journey.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return {
    inquiry,
    customer: buildCustomerSummary(relatedInquiries, journey),
    relatedInquiries,
    journey,
    activities,
    notifications,
    journeyAvailable: identities.visitorIds.size > 0 || identities.sessionIds.size > 0,
    summary: {
      pageViews: journey.length,
      firstSeenAt: journey[0]?.createdAt || "",
      lastSeenAt: journey.at(-1)?.createdAt || "",
      uniquePages: [...new Set(journey.map((event) => event.path))].length
    }
  };
}

export async function updateInquiryStatus(id, status) {
  await ensureOperationalStoreMigration();
  if (hasPersistentStore()) return updatePersistentInquiry(id, { status });
  const items = await readJson(INQUIRY_FILE, []);
  if (!items.some((item) => item.id === id)) return null;
  await writeJson(
    INQUIRY_FILE,
    items.map((item) => (item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item))
  );
  return { id, status };
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
    buyerType: String(input.buyerType || "").trim(),
    estimatedQuantity: String(input.estimatedQuantity || "").trim(),
    requiredSpecification: String(input.requiredSpecification || "").trim(),
    productModel: String(input.productModel || "").trim(),
    pageUrl: String(input.pageUrl || input.url || "").trim(),
    utmSource: String(input.utm_source || input.utmSource || "").trim(),
    utmMedium: String(input.utm_medium || input.utmMedium || "").trim(),
    utmCampaign: String(input.utm_campaign || input.utmCampaign || "").trim(),
    utmTerm: String(input.utm_term || input.utmTerm || "").trim(),
    utmContent: String(input.utm_content || input.utmContent || "").trim(),
    visitorId: String(input.visitorId || "").slice(0, 120),
    sessionId: String(input.sessionId || "").slice(0, 120),
    landingPage: String(input.landingPage || "").slice(0, 2000),
    referrer: String(input.referrer || "").slice(0, 2000),
    pageTitle: String(input.pageTitle || "").slice(0, 300),
    browserLanguage: String(input.browserLanguage || "").slice(0, 40),
    timezone: String(input.timezone || "").slice(0, 80),
    screen: String(input.screen || "").slice(0, 40),
    visitorCountry: String(input.visitorCountry || "").slice(0, 80),
    userAgent: String(input.userAgent || "").slice(0, 500),
    source: String(input.source || "website").trim(),
    status: "new",
    createdAt: new Date().toISOString()
  };
  await ensureOperationalStoreMigration();
  if (hasPersistentStore()) {
    await upsertPersistentInquiry(inquiry);
    await appendPersistentInquiryActivity({ inquiryId: inquiry.id, type: "received", actor: "website", summary: "Website inquiry received" });
    return inquiry;
  }
  const items = await readJson(INQUIRY_FILE, []);
  items.push(inquiry);
  await writeJson(INQUIRY_FILE, items);
  return inquiry;
}

export async function appendInquiryActivity(input) {
  const activity = {
    id: crypto.randomUUID(),
    inquiryId: String(input.inquiryId || ""),
    type: String(input.type || "note"),
    actor: String(input.actor || "admin"),
    summary: String(input.summary || "").slice(0, 1000),
    createdAt: new Date().toISOString()
  };
  if (!activity.inquiryId) return null;
  if (hasPersistentStore()) return appendPersistentInquiryActivity(activity);
  await appendAuditLog({ action: activity.type, module: "inquiry", target: `${activity.inquiryId}:${activity.summary}`, actor: activity.actor });
  return activity;
}

export async function getInquiryActivities(inquiryId) {
  if (hasPersistentStore()) return listPersistentInquiryActivities(inquiryId);
  return (await getAuditLogs())
    .filter((item) => item.module === "inquiry" && String(item.target || "").startsWith(`${inquiryId}:`))
    .map((item) => ({ id: item.id, inquiryId, type: item.action, actor: item.actor, summary: String(item.target).slice(inquiryId.length + 1), createdAt: item.createdAt }));
}

export async function recordInquiryNotification(input) {
  const notification = {
    id: crypto.randomUUID(),
    inquiryId: String(input.inquiryId || ""),
    channel: "email",
    status: input.sent ? "sent" : "failed",
    provider: "smtp",
    reason: String(input.reason || "").slice(0, 500),
    createdAt: new Date().toISOString()
  };
  if (!notification.inquiryId) return null;
  if (hasPersistentStore()) {
    await appendPersistentInquiryNotification(notification);
  }
  await appendInquiryActivity({
    inquiryId: notification.inquiryId,
    type: notification.status === "sent" ? "notification_sent" : "notification_failed",
    actor: "system",
    summary: notification.status === "sent" ? "Inquiry email notification delivered to SMTP server" : `Inquiry email notification failed: ${notification.reason || "unknown reason"}`
  });
  return notification;
}

export async function getInquiryNotifications(inquiryId) {
  if (hasPersistentStore()) return listPersistentInquiryNotifications(inquiryId);
  return [];
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
    companyPhone: String(input.companyPhone || current.companyPhone).trim(),
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
      const entries = await fs.readdir(/* turbopackIgnore: true */ root, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const ext = path.extname(entry.name).toLowerCase();
        if (!allowed.has(ext)) continue;
        const fullPath = path.join(/* turbopackIgnore: true */ root, entry.name);
        const stat = await fs.stat(/* turbopackIgnore: true */ fullPath);
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
  await ensureOperationalStoreMigration();
  if (hasPersistentStore()) {
    await insertPersistentVisitEvent(event);
    return event;
  }
  const events = await readJson(VISIT_FILE, []);
  events.push(event);
  await writeJson(VISIT_FILE, events.slice(-5000));
  return event;
}

export async function getVisitEvents() {
  await ensureOperationalStoreMigration();
  if (hasPersistentStore()) return listPersistentVisitEvents({ limit: 5000 });
  return (await readJson(VISIT_FILE, [])).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getVisitEventsPage(input = {}) {
  await ensureOperationalStoreMigration();
  if (hasPersistentStore()) return queryPersistentVisitEvents(input);
  return paginateItems(await getVisitEvents(), input);
}

export async function getCustomerDirectory(input = {}) {
  const [inquiries, events] = await Promise.all([getInquiries(), getVisitEvents()]);
  const rangeEvents = filterByDateRange(events, input);
  const rangeInquiries = filterByDateRange(inquiries, input);
  const customers = groupCustomers(rangeInquiries, rangeEvents);
  const keyword = String(input.q || "").trim().toLowerCase();
  const filtered = customers.filter((customer) => !keyword || [customer.name, customer.company, customer.email, customer.phone, customer.country, customer.identity].join(" ").toLowerCase().includes(keyword));
  const pageSize = [10, 20, 50, 100].includes(Number(input.pageSize)) ? Number(input.pageSize) : 20;
  const page = Math.max(1, Number(input.page) || 1);
  return { items: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, pageSize };
}

export async function getCustomerDetail(identity) {
  const [inquiries, events] = await Promise.all([getInquiries(), getVisitEvents()]);
  const seed = inquiries.find((item) => customerIdentity(item) === identity || String(item.visitorId || "") === identity || String(item.sessionId || "") === identity);
  if (!seed) {
    const event = events.find((item) => String(item.visitorId || "") === identity || String(item.sessionId || "") === identity);
    if (!event) return null;
    const journey = events.filter((item) => String(item.visitorId || "") === String(event.visitorId || "") || String(item.sessionId || "") === String(event.sessionId || "")).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return { customer: buildCustomerSummary([], journey, event), inquiries: [], journey, identity };
  }
  const relatedInquiries = collectCustomerInquiries(seed, inquiries);
  const identities = customerIdentitySet(relatedInquiries);
  const journey = events.filter((event) => identities.visitorIds.has(String(event.visitorId || "")) || identities.sessionIds.has(String(event.sessionId || ""))).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return { customer: buildCustomerSummary(relatedInquiries, journey), inquiries: relatedInquiries, journey, identity: customerIdentity(seed) };
}

export async function getAnalyticsReport({ from = "", to = "" } = {}) {
  const [events, products, news, inquiries] = await Promise.all([
    getVisitEvents(),
    getCmsItems("product", { includeInactive: true }),
    getCmsItems("news", { includeInactive: true }),
    getInquiries()
  ]);
  const filteredEvents = filterByDateRange(events, { from, to });
  const filteredInquiries = filterByDateRange(inquiries, { from, to });
  const visitors = new Set(filteredEvents.map((event) => event.visitorId || event.sessionId || event.id));
  return {
    pv: filteredEvents.length,
    uv: visitors.size,
    productViews: filteredEvents.filter((event) => event.path.includes("/product")).length,
    newsViews: filteredEvents.filter((event) => event.path.includes("/news")).length,
    inquiries: filteredInquiries.length,
    conversionRate: filteredEvents.length ? Number(((filteredInquiries.length / filteredEvents.length) * 100).toFixed(2)) : 0,
    products: products.length,
    news: news.length,
    sources: topBy(filteredEvents, "source", 8),
    devices: topBy(filteredEvents, "device", 8),
    countries: topBy(filteredEvents, "country", 8),
    topPages: topBy(filteredEvents, "path", 10),
    recent: filteredEvents.slice(0, 100),
    daily: buildDailySeries(filteredEvents)
  };
}

export async function getSeoReport(range = {}) {
  const [products, news, settings, gsc] = await Promise.all([
    getCmsItems("product"),
    getCmsItems("news"),
    getSiteSettings(),
    fetchGoogleSeoData(range)
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

export async function getPagePerformance(range = {}) {
  const analytics = await getAnalyticsReport(range);
  return analytics.topPages.map((item) => ({
    path: item.key,
    pv: item.count,
    uv: new Set(analytics.recent.filter((event) => event.path === item.key).map((event) => event.visitorId || event.id)).size,
    avgStay: 0,
    bounceRate: 0,
    conversion: 0
  }));
}

export async function getVisitPaths(input = {}) {
  const events = filterByDateRange(await getVisitEvents(), input);
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
  const values = [...bySession.entries()].map(([sessionId, paths]) => ({ sessionId, paths: [...new Set(paths)] }));
  return paginateItems(values, { ...input, from: "", to: "" });
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

export async function getSyncStatus(range = {}) {
  const [runs, visits] = await Promise.all([readJson(SYNC_FILE, []), getVisitEvents()]);
  const latestVisit = visits[0] || null;
  const visibleRuns = filterByDateRange(runs, range);
  return {
    trackingConfigured: true,
    trackingLastEvent: latestVisit?.createdAt || null,
    trackingState: latestVisit ? "active" : "waiting-for-first-visit",
    gscConfigured: isGoogleSeoConfigured(),
    gaConfigured: Boolean(process.env.GA_PROPERTY_ID),
    cronConfigured: Boolean(process.env.CRON_SECRET),
    lastRun: runs.at(-1) || null,
    runs: visibleRuns.slice(-500).reverse()
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

function filterByDateRange(items, { from, to }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return items;
  return items.filter((item) => {
    const date = dateInTimezone(item.createdAt, "Asia/Shanghai");
    return date >= from && date <= to;
  });
}

function customerIdentity(item) {
  const email = String(item?.email || "").trim().toLowerCase();
  if (email) return `email:${email}`;
  const phone = String(item?.phone || "").replace(/\D/g, "");
  if (phone) return `phone:${phone}`;
  if (item?.visitorId) return `visitor:${item.visitorId}`;
  if (item?.sessionId) return `session:${item.sessionId}`;
  return `record:${item?.id || "unknown"}`;
}

function identityTokens(item) {
  return new Set([
    String(item?.email || "").trim().toLowerCase() ? `email:${String(item.email).trim().toLowerCase()}` : "",
    String(item?.phone || "").replace(/\D/g, "") ? `phone:${String(item.phone).replace(/\D/g, "")}` : "",
    item?.visitorId ? `visitor:${item.visitorId}` : "",
    item?.sessionId ? `session:${item.sessionId}` : ""
  ].filter(Boolean));
}

function collectCustomerInquiries(seed, inquiries) {
  const selected = new Map([[seed.id, seed]]);
  const tokens = identityTokens(seed);
  let changed = true;
  while (changed) {
    changed = false;
    for (const inquiry of inquiries) {
      if (selected.has(inquiry.id)) continue;
      const inquiryTokens = identityTokens(inquiry);
      if (![...inquiryTokens].some((token) => tokens.has(token))) continue;
      selected.set(inquiry.id, inquiry);
      inquiryTokens.forEach((token) => tokens.add(token));
      changed = true;
    }
  }
  return [...selected.values()].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

function customerIdentitySet(inquiries) {
  const visitorIds = new Set(inquiries.map((item) => String(item.visitorId || "")).filter(Boolean));
  const sessionIds = new Set(inquiries.map((item) => String(item.sessionId || "")).filter(Boolean));
  return { visitorIds, sessionIds };
}

function buildCustomerSummary(inquiries, journey, fallbackEvent = null) {
  const latest = inquiries[0] || {};
  const first = inquiries.at(-1) || latest;
  return {
    identity: customerIdentity(latest.id ? latest : { visitorId: fallbackEvent?.visitorId, sessionId: fallbackEvent?.sessionId, id: fallbackEvent?.id }),
    name: latest.name || "匿名访客",
    company: latest.company || "",
    email: latest.email || "",
    phone: latest.phone || "",
    country: latest.country || latest.visitorCountry || fallbackEvent?.country || "",
    inquiryCount: inquiries.length,
    pageViews: journey.length,
    uniquePages: new Set(journey.map((event) => event.path)).size,
    firstSeenAt: journey[0]?.createdAt || first.createdAt || "",
    lastSeenAt: journey.at(-1)?.createdAt || latest.createdAt || "",
    landingPage: journey[0]?.path || latest.landingPage || "",
    lastPage: journey.at(-1)?.path || latest.pageUrl || ""
  };
}

function groupCustomers(inquiries, events) {
  const grouped = new Map();
  for (const inquiry of inquiries) {
    const identity = customerIdentity(inquiry);
    const group = grouped.get(identity) || { identity, inquiries: [], events: [] };
    group.inquiries.push(inquiry);
    grouped.set(identity, group);
  }
  const identitiesByVisitor = new Map();
  for (const group of grouped.values()) {
    for (const inquiry of group.inquiries) {
      if (inquiry.visitorId) identitiesByVisitor.set(String(inquiry.visitorId), group.identity);
      if (inquiry.sessionId) identitiesByVisitor.set(String(inquiry.sessionId), group.identity);
    }
  }
  for (const event of events) {
    const identity = identitiesByVisitor.get(String(event.visitorId || "")) || identitiesByVisitor.get(String(event.sessionId || "")) || (event.visitorId ? `visitor:${event.visitorId}` : event.sessionId ? `session:${event.sessionId}` : `record:${event.id}`);
    const group = grouped.get(identity) || { identity, inquiries: [], events: [] };
    group.events.push(event);
    grouped.set(identity, group);
  }
  return [...grouped.values()].map((group) => ({ ...buildCustomerSummary(group.inquiries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), group.events.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))), identity: group.identity })).sort((left, right) => new Date(right.lastSeenAt || 0) - new Date(left.lastSeenAt || 0));
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
