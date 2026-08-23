import { apiError, apiOk, requireAdminApi } from "@/lib/adminApi";
import { appendAuditLog, appendInquiryActivity, getInquiryDetail, updateInquiryStatus } from "@/lib/cmsStore";

const allowedStatuses = new Set(["new", "contacted", "quoted", "closed", "invalid", "archived"]);

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const detail = await getInquiryDetail(id);
  if (!detail) return apiError("Inquiry not found", 404);
  return apiOk(detail);
}

export async function PATCH(request, { params }) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body", 400);
  }

  const status = String(body?.status || "").trim();
  if (!allowedStatuses.has(status)) return apiError("Invalid inquiry status", 400);
  const updated = await updateInquiryStatus(id, status);
  if (!updated) return apiError("Inquiry not found", 404);

  const note = String(body?.note || "").trim().slice(0, 1000);
  await appendInquiryActivity({
    inquiryId: id,
    type: "status_changed",
    actor: "admin",
    summary: note ? `Status changed to ${status}. ${note}` : `Status changed to ${status}`
  });
  await appendAuditLog({ action: "update_status", module: "inquiry", target: id, actor: "admin" });
  return apiOk({ ...updated, status });
}
