import crypto from "node:crypto";
import { getPersistentValue, hasPersistentStore, setPersistentValue } from "@/lib/persistentStore";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const localAttempts = new Map();

export async function allowInquiry(request) {
  const key = `inquiry-rate-${visitorKey(request)}`;
  const now = Date.now();
  const previous = hasPersistentStore() ? await getPersistentValue(key) : localAttempts.get(key);
  const attempts = Array.isArray(previous?.attempts) ? previous.attempts.filter((value) => Number(value) > now - WINDOW_MS) : [];
  if (attempts.length >= MAX_ATTEMPTS) return false;
  const next = { attempts: [...attempts, now], updatedAt: new Date(now).toISOString() };
  if (hasPersistentStore()) await setPersistentValue(key, next);
  else localAttempts.set(key, next);
  return true;
}

function visitorKey(request) {
  const forwarded = request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || "unknown";
  const address = forwarded.split(",")[0].trim();
  return crypto.createHash("sha256").update(address).digest("hex").slice(0, 32);
}
