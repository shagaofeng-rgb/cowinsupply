import fs from "node:fs/promises";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
const backupFlag = process.argv.indexOf("--backup-dir");
const backupDir = backupFlag >= 0 ? process.argv[backupFlag + 1] : "";

if (!databaseUrl) {
  throw new Error("DATABASE_URL or POSTGRES_URL is required.");
}

const sql = neon(databaseUrl);
const tableNames = [
  "cowin_store",
  "cowin_job_locks",
  "cowin_inquiries",
  "cowin_visit_events",
  "cowin_inquiry_activities",
  "cowin_inquiry_notifications"
];

const [tables, storeSummary, inquirySummary, orphanSummary, expiredLocks, cmsRows] = await Promise.all([
  sql`SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE 'cowin_%'
      ORDER BY table_name`,
  sql`SELECT store_key,
             jsonb_typeof(value) AS value_type,
             CASE WHEN jsonb_typeof(value) = 'array' THEN jsonb_array_length(value) ELSE NULL END AS item_count,
             updated_at
      FROM cowin_store
      ORDER BY store_key`,
  sql`SELECT status, COUNT(*)::int AS count
      FROM cowin_inquiries
      GROUP BY status
      ORDER BY status`,
  sql`SELECT
        (SELECT COUNT(*)::int FROM cowin_inquiry_activities a LEFT JOIN cowin_inquiries i ON i.id = a.inquiry_id WHERE i.id IS NULL) AS orphan_activities,
        (SELECT COUNT(*)::int FROM cowin_inquiry_notifications n LEFT JOIN cowin_inquiries i ON i.id = n.inquiry_id WHERE i.id IS NULL) AS orphan_notifications`,
  sql`SELECT COUNT(*)::int AS count FROM cowin_job_locks WHERE expires_at <= NOW()`,
  sql`SELECT value FROM cowin_store WHERE store_key = 'cms-items' LIMIT 1`
]);

const counts = {};
for (const tableName of tableNames) {
  if (!tables.some((row) => row.table_name === tableName)) {
    counts[tableName] = null;
    continue;
  }
  const rows = await queryTableCount(tableName);
  counts[tableName] = Number(rows[0]?.count || 0);
}

const cmsItems = Array.isArray(cmsRows[0]?.value) ? cmsRows[0].value : [];
const cmsSummary = summarizeCmsItems(cmsItems);
const report = {
  checkedAt: new Date().toISOString(),
  database: "configured",
  tables: tables.map((row) => row.table_name),
  counts,
  store: storeSummary.map((row) => ({
    key: row.store_key,
    valueType: row.value_type,
    itemCount: row.item_count == null ? null : Number(row.item_count),
    updatedAt: new Date(row.updated_at).toISOString()
  })),
  inquiriesByStatus: Object.fromEntries(inquirySummary.map((row) => [row.status, Number(row.count)])),
  integrity: {
    orphanActivities: Number(orphanSummary[0]?.orphan_activities || 0),
    orphanNotifications: Number(orphanSummary[0]?.orphan_notifications || 0),
    expiredLocks: Number(expiredLocks[0]?.count || 0)
  },
  cms: cmsSummary
};

if (backupDir) {
  await fs.mkdir(backupDir, { recursive: true, mode: 0o700 });
  const backup = {};
  for (const tableName of tableNames) {
    if (counts[tableName] == null) continue;
    backup[tableName] = await queryTableRows(tableName);
  }
  const backupPath = path.join(backupDir, `cowinsupply-database-${Date.now()}.json`);
  await fs.writeFile(backupPath, JSON.stringify({ createdAt: new Date().toISOString(), tables: backup }), { mode: 0o600 });
  report.backup = { created: true, directory: backupDir, tables: Object.keys(backup) };
}

console.log(JSON.stringify(report, null, 2));

if (report.integrity.orphanActivities || report.integrity.orphanNotifications || cmsSummary.duplicateSlugs.length || cmsSummary.missingRequired.length) {
  process.exitCode = 1;
}

function summarizeCmsItems(items) {
  const byType = {};
  const byStatus = {};
  const duplicateSlugs = [];
  const missingRequired = [];
  const seen = new Map();

  for (const item of items) {
    const type = String(item?.type || "unknown");
    const status = String(item?.status || "unknown");
    byType[type] = (byType[type] || 0) + 1;
    byStatus[status] = (byStatus[status] || 0) + 1;

    if (["product", "news", "blog"].includes(type)) {
      if (!item?.slug || !item?.title) missingRequired.push({ type, id: item?.id || "", missing: [!item?.slug ? "slug" : "", !item?.title ? "title" : ""].filter(Boolean) });
      const key = `${type}:${item?.slug || ""}`;
      if (item?.slug && seen.has(key)) duplicateSlugs.push({ type, slug: item.slug, ids: [seen.get(key), item?.id || ""] });
      else if (item?.slug) seen.set(key, item?.id || "");
    }
  }

  const published = items.filter((item) => item?.status === "published");
  const latestNews = published
    .filter((item) => item?.type === "news")
    .sort((a, b) => new Date(b.publishedAt || b.updatedAt || b.createdAt || 0) - new Date(a.publishedAt || a.updatedAt || a.createdAt || 0))[0];

  return {
    total: items.length,
    byType,
    byStatus,
    publishedByType: Object.fromEntries(["product", "news", "blog"].map((type) => [type, published.filter((item) => item?.type === type).length])),
    duplicateSlugs,
    missingRequired,
    latestPublishedNews: latestNews ? { id: latestNews.id || "", slug: latestNews.slug || "", publishedAt: latestNews.publishedAt || "" } : null
  };
}

function queryTableCount(tableName) {
  switch (tableName) {
    case "cowin_store": return sql`SELECT COUNT(*)::int AS count FROM cowin_store`;
    case "cowin_job_locks": return sql`SELECT COUNT(*)::int AS count FROM cowin_job_locks`;
    case "cowin_inquiries": return sql`SELECT COUNT(*)::int AS count FROM cowin_inquiries`;
    case "cowin_visit_events": return sql`SELECT COUNT(*)::int AS count FROM cowin_visit_events`;
    case "cowin_inquiry_activities": return sql`SELECT COUNT(*)::int AS count FROM cowin_inquiry_activities`;
    case "cowin_inquiry_notifications": return sql`SELECT COUNT(*)::int AS count FROM cowin_inquiry_notifications`;
    default: throw new Error(`Unsupported table: ${tableName}`);
  }
}

function queryTableRows(tableName) {
  switch (tableName) {
    case "cowin_store": return sql`SELECT * FROM cowin_store ORDER BY store_key`;
    case "cowin_job_locks": return sql`SELECT * FROM cowin_job_locks ORDER BY lock_name`;
    case "cowin_inquiries": return sql`SELECT * FROM cowin_inquiries ORDER BY created_at`;
    case "cowin_visit_events": return sql`SELECT * FROM cowin_visit_events ORDER BY created_at`;
    case "cowin_inquiry_activities": return sql`SELECT * FROM cowin_inquiry_activities ORDER BY created_at`;
    case "cowin_inquiry_notifications": return sql`SELECT * FROM cowin_inquiry_notifications ORDER BY created_at`;
    default: throw new Error(`Unsupported table: ${tableName}`);
  }
}
