import { apiError, apiOk } from "@/lib/adminApi";
import { runNewsIngest } from "@/lib/newsAutomationV2";
import { requireCronSecret } from "@/lib/cronAuth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;
  try {
    const run = await runNewsIngest({ trigger: "vercel_news_ingest_cron", dryRun: request.nextUrl.searchParams.get("dryRun") === "1" });
    return apiOk(run, { status: run.status === "failed" ? 500 : 200 });
  } catch (error) {
    return apiError(`News ingest failed: ${String(error?.message || "unknown-error").slice(0, 120)}`, 500);
  }
}
