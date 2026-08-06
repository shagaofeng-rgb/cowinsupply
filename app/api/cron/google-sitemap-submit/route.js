import { apiError, apiOk } from "@/lib/adminApi";
import { refreshSitemap } from "@/lib/sitemapService";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") || "";
    const token = request.nextUrl.searchParams.get("secret") || "";
    if (auth !== `Bearer ${secret}` && token !== secret) return apiError("Unauthorized cron request", 401);
  }

  const run = await refreshSitemap({ trigger: "vercel_google_sitemap_submit", submit: true });
  return apiOk(run, { status: run.errors?.length || !run.gscSubmit?.success ? 500 : 200 });
}
