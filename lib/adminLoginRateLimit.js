import crypto from "node:crypto";
import { getPersistentValue, hasPersistentStore, setPersistentValue } from "@/lib/persistentStore";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const localFailures = new Map();

export async function isAdminLoginAllowed(request, email) {
  const key = loginKey(request, email);
  const failures = await currentFailures(key);
  return failures.length < MAX_FAILURES;
}

export async function recordAdminLoginFailure(request, email) {
  const key = loginKey(request, email);
  const failures = await currentFailures(key);
  await writeFailures(key, [...failures, Date.now()]);
}

export async function clearAdminLoginFailures(request, email) {
  await writeFailures(loginKey(request, email), []);
}

async function currentFailures(key) {
  const now = Date.now();
  const saved = hasPersistentStore() ? await getPersistentValue(key) : localFailures.get(key);
  return (Array.isArray(saved?.failures) ? saved.failures : []).filter((value) => Number(value) > now - WINDOW_MS);
}

async function writeFailures(key, failures) {
  const value = { failures, updatedAt: new Date().toISOString() };
  if (hasPersistentStore()) await setPersistentValue(key, value);
  else if (failures.length) localFailures.set(key, value);
  else localFailures.delete(key);
}

function loginKey(request, email) {
  const forwarded = request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || "unknown";
  const address = forwarded.split(",")[0].trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  return `admin-login-rate-${crypto.createHash("sha256").update(`${address}|${normalizedEmail}`).digest("hex").slice(0, 32)}`;
}
