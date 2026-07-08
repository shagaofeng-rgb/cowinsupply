import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getConfiguredAdminPassword,
  isAdminPasswordConfigured,
  isConfiguredAdminEmail
} from "@/lib/adminAccountStore";

export const ADMIN_COOKIE_NAME = "cowinsupply_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function secret() {
  return (
    process.env.ADMIN_JWT_SECRET ||
    process.env.ADMIN_PASSWORD_HASH ||
    process.env.ADMIN_PASSWORD ||
    process.env.ADMIN_DEFAULT_PASSWORD ||
    "cowinsupply-local-admin-secret"
  );
}

function sign(value) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

export function hashAdminPassword(password) {
  return crypto.createHash("sha256").update(`${password}:${secret()}`).digest("hex");
}

export async function verifyAdminCredentials(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const candidate = String(password || "");

  if (!normalizedEmail || !candidate || !isConfiguredAdminEmail(normalizedEmail)) {
    return false;
  }

  if (process.env.ADMIN_PASSWORD_HASH) {
    return hashAdminPassword(candidate) === process.env.ADMIN_PASSWORD_HASH;
  }

  return candidate === getConfiguredAdminPassword();
}

export function isAdminAuthConfigured() {
  return isAdminPasswordConfigured() || Boolean(process.env.ADMIN_PASSWORD_HASH);
}

export function createAdminSession(email) {
  const payload = {
    email: String(email || "").trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyAdminSession(token) {
  if (!token || !token.includes(".")) return null;
  const [encodedPayload, signature] = token.split(".");
  const expectedSignature = sign(encodedPayload);
  if (!signature || signature.length !== expectedSignature.length) return null;

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (!payload?.email || !payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminSession(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  };
}
