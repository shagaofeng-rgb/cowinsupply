import { apiError, apiOk } from "@/lib/adminApi";
import { requireCronSecret } from "@/lib/cronAuth";
import { refreshSitemap } from "@/lib/sitemapService";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;

  // Sitemap content still refreshes daily; Google submission has its own three-day cron.
  const run = await refreshSitemap({ trigger: "vercel_sitemap_refresh", submit: false });
  return apiOk(run, { status: run.errors?.length ? 500 : 200 });
}
