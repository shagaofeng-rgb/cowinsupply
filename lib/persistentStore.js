import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";

let sqlClient;
let schemaPromise;

function databaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

export function hasPersistentStore() {
  return Boolean(databaseUrl());
}

export function getPersistentStoreStatus() {
  return {
    configured: hasPersistentStore(),
    provider: hasPersistentStore() ? "PostgreSQL (Neon)" : "Not configured"
  };
}

function sql() {
  if (!hasPersistentStore()) throw new Error("DATABASE_URL or POSTGRES_URL is required for persistent storage.");
  sqlClient ||= neon(databaseUrl());
  return sqlClient;
}

async function ensureSchema() {
  if (!hasPersistentStore()) return;
  schemaPromise ||= (async () => {
    await Promise.all([
    sql()`CREATE TABLE IF NOT EXISTS cowin_store (
      store_key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    sql()`CREATE TABLE IF NOT EXISTS cowin_job_locks (
      lock_name TEXT PRIMARY KEY,
      token TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    sql()`CREATE TABLE IF NOT EXISTS cowin_inquiries (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      visitor_id TEXT,
      session_id TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    sql()`CREATE TABLE IF NOT EXISTS cowin_visit_events (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      visitor_id TEXT,
      session_id TEXT,
      created_at TIMESTAMPTZ NOT NULL
    )`,
    sql()`CREATE TABLE IF NOT EXISTS cowin_inquiry_activities (
      id TEXT PRIMARY KEY,
      inquiry_id TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    sql()`CREATE TABLE IF NOT EXISTS cowin_inquiry_notifications (
      id TEXT PRIMARY KEY,
      inquiry_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      status TEXT NOT NULL,
      provider TEXT NOT NULL,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`
    ]);
    await Promise.all([
      sql()`CREATE INDEX IF NOT EXISTS cowin_inquiries_created_at_idx ON cowin_inquiries (created_at DESC)`,
      sql()`CREATE INDEX IF NOT EXISTS cowin_inquiries_status_created_at_idx ON cowin_inquiries (status, created_at DESC)`,
      sql()`CREATE INDEX IF NOT EXISTS cowin_inquiries_visitor_idx ON cowin_inquiries (visitor_id, session_id)`,
      sql()`CREATE INDEX IF NOT EXISTS cowin_inquiries_email_idx ON cowin_inquiries ((lower(coalesce(payload->>'email', ''))))`,
      sql()`CREATE INDEX IF NOT EXISTS cowin_inquiries_phone_idx ON cowin_inquiries ((regexp_replace(coalesce(payload->>'phone', ''), '\\D', '', 'g')))`,
      sql()`CREATE INDEX IF NOT EXISTS cowin_visit_events_visitor_idx ON cowin_visit_events (visitor_id, created_at ASC)`,
      sql()`CREATE INDEX IF NOT EXISTS cowin_visit_events_session_idx ON cowin_visit_events (session_id, created_at ASC)`,
      sql()`CREATE INDEX IF NOT EXISTS cowin_visit_events_created_at_idx ON cowin_visit_events (created_at DESC)`,
      sql()`CREATE INDEX IF NOT EXISTS cowin_inquiry_activities_inquiry_idx ON cowin_inquiry_activities (inquiry_id, created_at DESC)`,
      sql()`CREATE INDEX IF NOT EXISTS cowin_inquiry_notifications_inquiry_idx ON cowin_inquiry_notifications (inquiry_id, created_at DESC)`
    ]);
  })();
  await schemaPromise;
}

export async function getOperationalStoreMigration() {
  if (!hasPersistentStore()) return null;
  await ensureSchema();
  return getPersistentValue("operational-store-migration-v1");
}

export async function setOperationalStoreMigration(value) {
  if (!hasPersistentStore()) return;
  await ensureSchema();
  await setPersistentValue("operational-store-migration-v1", value);
}

export async function upsertPersistentInquiry(inquiry) {
  if (!hasPersistentStore()) return null;
  await ensureSchema();
  const createdAt = new Date(inquiry.createdAt || Date.now()).toISOString();
  const updatedAt = new Date(inquiry.updatedAt || inquiry.createdAt || Date.now()).toISOString();
  await sql()`INSERT INTO cowin_inquiries (id, payload, status, visitor_id, session_id, created_at, updated_at)
    VALUES (${inquiry.id}, ${JSON.stringify(inquiry)}::jsonb, ${inquiry.status || "new"}, ${inquiry.visitorId || null}, ${inquiry.sessionId || null}, ${createdAt}::timestamptz, ${updatedAt}::timestamptz)
    ON CONFLICT (id) DO UPDATE SET
      payload = EXCLUDED.payload,
      status = EXCLUDED.status,
      visitor_id = EXCLUDED.visitor_id,
      session_id = EXCLUDED.session_id,
      updated_at = EXCLUDED.updated_at`;
  return inquiry;
}

export async function listPersistentInquiries() {
  if (!hasPersistentStore()) return null;
  await ensureSchema();
  const rows = await sql()`SELECT payload FROM cowin_inquiries ORDER BY created_at DESC`;
  return rows.map((row) => row.payload);
}

export async function queryPersistentInquiries({ page = 1, pageSize = 20, q = "", status = "", from = "", to = "" } = {}) {
  if (!hasPersistentStore()) return null;
  await ensureSchema();
  const { limit, offset } = getPageBounds(page, pageSize);
  const keyword = String(q || "").trim().toLowerCase();
  const like = `%${keyword}%`;
  const start = dateStart(from);
  const end = dateEnd(to);
  const rows = await sql()`
    SELECT payload, count(*) OVER() AS total
    FROM cowin_inquiries
    WHERE (${String(status || "")} = '' OR status = ${String(status || "")})
      AND (${start} = '' OR created_at >= ${start})
      AND (${end} = '' OR created_at < ${end})
      AND (${keyword} = '' OR lower(concat_ws(' ', payload->>'name', payload->>'company', payload->>'email', payload->>'phone', payload->>'product', payload->>'message', payload->>'country')) LIKE ${like})
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}`;
  return { items: rows.map((row) => row.payload), total: Number(rows[0]?.total || 0), page: Number(page) || 1, pageSize: limit };
}

export async function getPersistentInquiry(id) {
  if (!hasPersistentStore()) return null;
  await ensureSchema();
  const rows = await sql()`SELECT payload FROM cowin_inquiries WHERE id = ${id} LIMIT 1`;
  return rows[0]?.payload || null;
}

export async function updatePersistentInquiry(id, patch) {
  if (!hasPersistentStore()) return null;
  const current = await getPersistentInquiry(id);
  if (!current) return null;
  const next = { ...current, ...patch, id, updatedAt: new Date().toISOString() };
  await upsertPersistentInquiry(next);
  return next;
}

export async function insertPersistentVisitEvent(event) {
  if (!hasPersistentStore()) return null;
  await ensureSchema();
  const createdAt = new Date(event.createdAt || Date.now()).toISOString();
  await sql()`INSERT INTO cowin_visit_events (id, payload, visitor_id, session_id, created_at)
    VALUES (${event.id}, ${JSON.stringify(event)}::jsonb, ${event.visitorId || null}, ${event.sessionId || null}, ${createdAt}::timestamptz)
    ON CONFLICT (id) DO NOTHING`;
  return event;
}

export async function listPersistentVisitEvents({ visitorId = "", sessionId = "", limit = 5000 } = {}) {
  if (!hasPersistentStore()) return null;
  await ensureSchema();
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 5000);
  let rows;
  if (visitorId && sessionId) {
    rows = await sql()`SELECT payload FROM cowin_visit_events WHERE visitor_id = ${visitorId} OR session_id = ${sessionId} ORDER BY created_at ASC LIMIT ${safeLimit}`;
  } else if (visitorId) {
    rows = await sql()`SELECT payload FROM cowin_visit_events WHERE visitor_id = ${visitorId} ORDER BY created_at ASC LIMIT ${safeLimit}`;
  } else if (sessionId) {
    rows = await sql()`SELECT payload FROM cowin_visit_events WHERE session_id = ${sessionId} ORDER BY created_at ASC LIMIT ${safeLimit}`;
  } else {
    rows = await sql()`SELECT payload FROM cowin_visit_events ORDER BY created_at DESC LIMIT ${safeLimit}`;
  }
  return rows.map((row) => row.payload);
}

export async function queryPersistentVisitEvents({ page = 1, pageSize = 20, q = "", from = "", to = "", source = "", device = "", country = "", visitorId = "" } = {}) {
  if (!hasPersistentStore()) return null;
  await ensureSchema();
  const { limit, offset } = getPageBounds(page, pageSize);
  const keyword = String(q || "").trim().toLowerCase();
  const like = `%${keyword}%`;
  const start = dateStart(from);
  const end = dateEnd(to);
  const rows = await sql()`
    SELECT payload, count(*) OVER() AS total
    FROM cowin_visit_events
    WHERE (${start} = '' OR created_at >= ${start})
      AND (${end} = '' OR created_at < ${end})
      AND (${String(source || "")} = '' OR payload->>'source' = ${String(source || "")})
      AND (${String(device || "")} = '' OR payload->>'device' = ${String(device || "")})
      AND (${String(country || "")} = '' OR payload->>'country' = ${String(country || "")})
      AND (${String(visitorId || "")} = '' OR visitor_id = ${String(visitorId || "")} OR session_id = ${String(visitorId || "")})
      AND (${keyword} = '' OR lower(concat_ws(' ', payload->>'path', payload->>'title', payload->>'source', payload->>'country', visitor_id, session_id)) LIKE ${like})
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}`;
  return { items: rows.map((row) => row.payload), total: Number(rows[0]?.total || 0), page: Number(page) || 1, pageSize: limit };
}

export async function appendPersistentInquiryActivity(activity) {
  if (!hasPersistentStore()) return null;
  await ensureSchema();
  const record = { id: activity.id || crypto.randomUUID(), ...activity, createdAt: activity.createdAt || new Date().toISOString() };
  await sql()`INSERT INTO cowin_inquiry_activities (id, inquiry_id, activity_type, payload, created_at)
    VALUES (${record.id}, ${record.inquiryId}, ${record.type}, ${JSON.stringify(record)}::jsonb, ${record.createdAt}::timestamptz)`;
  return record;
}

export async function listPersistentInquiryActivities(inquiryId) {
  if (!hasPersistentStore()) return null;
  await ensureSchema();
  const rows = await sql()`SELECT payload FROM cowin_inquiry_activities WHERE inquiry_id = ${inquiryId} ORDER BY created_at DESC LIMIT 100`;
  return rows.map((row) => row.payload);
}

export async function appendPersistentInquiryNotification(notification) {
  if (!hasPersistentStore()) return null;
  await ensureSchema();
  const record = { id: notification.id || crypto.randomUUID(), ...notification, createdAt: notification.createdAt || new Date().toISOString() };
  await sql()`INSERT INTO cowin_inquiry_notifications (id, inquiry_id, channel, status, provider, payload, created_at)
    VALUES (${record.id}, ${record.inquiryId}, ${record.channel}, ${record.status}, ${record.provider}, ${JSON.stringify(record)}::jsonb, ${record.createdAt}::timestamptz)`;
  return record;
}

export async function listPersistentInquiryNotifications(inquiryId) {
  if (!hasPersistentStore()) return null;
  await ensureSchema();
  const rows = await sql()`SELECT payload FROM cowin_inquiry_notifications WHERE inquiry_id = ${inquiryId} ORDER BY created_at DESC LIMIT 50`;
  return rows.map((row) => row.payload);
}

export async function getPersistentValue(storeKey) {
  await ensureSchema();
  const rows = await sql()`SELECT value FROM cowin_store WHERE store_key = ${storeKey} LIMIT 1`;
  return rows[0]?.value;
}

export async function setPersistentValue(storeKey, value) {
  await ensureSchema();
  await sql()`INSERT INTO cowin_store (store_key, value, updated_at)
    VALUES (${storeKey}, ${JSON.stringify(value)}::jsonb, NOW())
    ON CONFLICT (store_key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`;
}

export async function acquirePersistentLock(lockName, ttlMs = 14 * 60 * 1000) {
  if (!hasPersistentStore()) return null;
  await ensureSchema();
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  const rows = await sql()`INSERT INTO cowin_job_locks (lock_name, token, expires_at, updated_at)
    VALUES (${lockName}, ${token}, ${expiresAt}::timestamptz, NOW())
    ON CONFLICT (lock_name) DO UPDATE
      SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at, updated_at = NOW()
      WHERE cowin_job_locks.expires_at <= NOW()
    RETURNING token`;
  return rows[0]?.token === token ? { lockName, token } : null;
}

export async function releasePersistentLock(lock) {
  if (!lock || !hasPersistentStore()) return;
  await ensureSchema();
  await sql()`DELETE FROM cowin_job_locks WHERE lock_name = ${lock.lockName} AND token = ${lock.token}`;
}

function getPageBounds(page, pageSize) {
  const limit = [10, 20, 50, 100].includes(Number(pageSize)) ? Number(pageSize) : 20;
  const safePage = Math.max(1, Number(page) || 1);
  return { limit, offset: (safePage - 1) * limit };
}

function dateStart(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ? `${value}T00:00:00+08:00` : "";
}

function dateEnd(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return "";
  const date = new Date(`${value}T00:00:00+08:00`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString();
}
