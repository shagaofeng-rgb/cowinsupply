import { apiError, apiOk } from "@/lib/adminApi";
import { requireCronSecret } from "@/lib/cronAuth";
import { runNewsDaily } from "@/lib/newsAutomationV2";
import { publicationHttpStatus } from "@/lib/newsReliability";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;
  try {
    const run = await runNewsDaily({
      trigger: "vercel_news_daily_cron",
      dryRun: request.nextUrl.searchParams.get("dryRun") === "1"
    });
    return apiOk(run, { status: publicationHttpStatus(run) });
  } catch (error) {
    return apiError(`Daily News automation failed: ${String(error?.message || "unknown-error").slice(0, 120)}`, 500);
  }
}
