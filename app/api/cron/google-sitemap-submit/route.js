import { apiError, apiOk } from "@/lib/adminApi";
import { requireCronSecret } from "@/lib/cronAuth";
import { refreshSitemap } from "@/lib/sitemapService";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;

  const run = await refreshSitemap({ trigger: "vercel_google_sitemap_submit", submit: true });
  return apiOk(run, { status: run.errors?.length || !run.gscSubmit?.success ? 500 : 200 });
}
