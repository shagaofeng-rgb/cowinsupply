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

  const submit =
    request.nextUrl.searchParams.get("submit") === "1" ||
    String(process.env.GOOGLE_SEARCH_CONSOLE_ENABLED || "").toLowerCase() === "true";
  const run = await refreshSitemap({ trigger: "vercel_cron", submit });
  return apiOk(run, { status: run.errors?.length ? 500 : 200 });
}
