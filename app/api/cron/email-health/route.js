import { apiError, apiOk } from "@/lib/adminApi";
import { appendAuditLog } from "@/lib/cmsStore";
import { sendEmailHealthCheck } from "@/lib/emailService";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") || "";
    const token = request.nextUrl.searchParams.get("secret") || "";
    if (auth !== `Bearer ${secret}` && token !== secret) return apiError("Unauthorized cron request", 401);
  }

  try {
    const result = await sendEmailHealthCheck({ trigger: "half-month-cron" });
    await appendAuditLog({
      actor: "email-health-cron",
      action: "email_health_check",
      module: "email",
      target: process.env.ADMIN_NOTIFICATION_EMAIL || "",
      result: result.sent ? "success" : "failed"
    });
    return apiOk({ result });
  } catch (error) {
    await appendAuditLog({
      actor: "email-health-cron",
      action: "email_health_check",
      module: "email",
      target: process.env.ADMIN_NOTIFICATION_EMAIL || "",
      result: "failed"
    });
    return apiError("Email health check failed", 500, { reason: error?.message || "unknown" });
  }
}
