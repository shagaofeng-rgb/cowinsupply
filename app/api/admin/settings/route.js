import { redirect } from "next/navigation";
import { apiError, apiOk, requireAdminApi } from "@/lib/adminApi";
import { appendAuditLog, getSiteSettings, saveSiteSettings } from "@/lib/cmsStore";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  return apiOk(await getSiteSettings());
}

export async function POST(request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const form = await request.formData();
  const siteUrl = String(form.get("siteUrl") || "").trim();
  if (siteUrl && !/^https?:\/\/[^\s]+$/i.test(siteUrl)) {
    return apiError("Invalid site URL", 400);
  }

  await saveSiteSettings(Object.fromEntries(form.entries()));
  await appendAuditLog({ action: "save_settings", module: "settings", target: siteUrl || "site" });
  redirect(request.headers.get("referer") || "/admin/settings");
}
