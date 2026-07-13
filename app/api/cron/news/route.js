import { apiError, apiOk } from "@/lib/adminApi";
import { runNewsAutomation } from "@/lib/newsAutomation";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") || "";
    const token = request.nextUrl.searchParams.get("secret") || "";
    if (auth !== `Bearer ${secret}` && token !== secret) return apiError("Unauthorized cron request", 401);
  }
  try {
    const job = await runNewsAutomation({ trigger: "vercel_cron" });
    return apiOk({ job });
  } catch (error) {
    console.error("News automation failed", { message: error instanceof Error ? error.message : "Unknown error" });
    return apiError("News automation failed. Check the configured sources and persistent database.", 500);
  }
}
