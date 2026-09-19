import { apiError, apiOk } from "@/lib/adminApi";
import { requireCronSecret } from "@/lib/cronAuth";
import { appendAuditLog } from "@/lib/cmsStore";
import { notificationRecipient, sendEmailHealthCheck } from "@/lib/emailService";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await sendEmailHealthCheck({ trigger: "half-month-cron" });
    await appendAuditLog({
      actor: "email-health-cron",
      action: "email_health_check",
      module: "email",
      target: notificationRecipient,
      result: result.sent ? "success" : "failed"
    });
    return apiOk({ result });
  } catch (error) {
    await appendAuditLog({
      actor: "email-health-cron",
      action: "email_health_check",
      module: "email",
      target: notificationRecipient,
      result: "failed"
    });
    return apiError("Email health check failed", 500, { reason: error?.message || "unknown" });
  }
}
