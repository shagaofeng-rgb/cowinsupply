import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, adminCookieOptions, createAdminSession, verifyAdminCredentials } from "@/lib/adminAuth";
import { appendAuditLog } from "@/lib/cmsStore";

export async function POST(request) {
  const form = await request.formData();
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");

  if (!(await verifyAdminCredentials(email, password))) {
    await appendAuditLog({ actor: email || "unknown", action: "login_failed", module: "auth", result: "failed" });
    return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), 303);
  }

  await appendAuditLog({ actor: email, action: "login_success", module: "auth" });
  const response = NextResponse.redirect(new URL("/admin", request.url), 303);
  response.cookies.set(ADMIN_COOKIE_NAME, createAdminSession(email), adminCookieOptions());
  return response;
}
