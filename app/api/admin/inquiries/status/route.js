import { redirect } from "next/navigation";
import { apiError, requireAdminApi } from "@/lib/adminApi";
import { appendAuditLog, appendInquiryActivity, updateInquiryStatus } from "@/lib/cmsStore";

const allowedStatuses = new Set(["new", "contacted", "quoted", "closed", "invalid", "archived"]);

export async function POST(request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const form = await request.formData();
  const id = String(form.get("id") || "").trim();
  const status = String(form.get("status") || "").trim();

  if (!id || !allowedStatuses.has(status)) {
    return apiError("Invalid inquiry status request", 400);
  }

  const updated = await updateInquiryStatus(id, status);
  if (!updated) return apiError("Inquiry not found", 404);
  await appendInquiryActivity({ inquiryId: id, type: "status_changed", actor: "admin", summary: `Status changed to ${status}` });
  await appendAuditLog({ action: "update_status", module: "inquiry", target: id });
  redirect("/admin/inquiries");
}
