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
  const job = await runNewsAutomation({ trigger: "vercel_cron" });
  return apiOk({ job });
}
