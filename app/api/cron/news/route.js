import { apiError, apiOk } from "@/lib/adminApi";
import { runNewsAutomation } from "@/lib/newsAutomationV2";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") || "";
  const querySecret = request.nextUrl.searchParams.get("secret") || "";
  if (process.env.VERCEL && !secret) return apiError("CRON_SECRET is required in production", 503);
  if (secret && authorization !== `Bearer ${secret}` && querySecret !== secret) return apiError("Unauthorized cron request", 401);
  try {
    const run = await runNewsAutomation({ trigger: "vercel_news_v2_cron", dryRun: request.nextUrl.searchParams.get("dryRun") === "1" });
    return apiOk(run, { status: run.status === "failed" ? 500 : 200 });
  } catch (error) {
    return apiError("News automation failed: " + String(error?.message || "unknown-error").slice(0, 120), 500);
  }
}
