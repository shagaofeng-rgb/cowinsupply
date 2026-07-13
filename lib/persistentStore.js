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
  schemaPromise ||= Promise.all([
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
    )`
  ]);
  await schemaPromise;
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
