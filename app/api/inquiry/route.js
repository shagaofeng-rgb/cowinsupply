import { apiError, apiOk } from "@/lib/adminApi";
import { appendInquiryActivity, recordInquiryNotification, saveInquiry } from "@/lib/cmsStore";
import { sendAdminInquiryEmail } from "@/lib/emailService";
import { allowInquiry } from "@/lib/inquiryRateLimit";
import { inquirySubmissionId } from "@/lib/inquirySubmission";
import { after } from "next/server";

export const maxDuration = 60;

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

export async function POST(request) {
  const contentType = request.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  let body;
  try {
    body = isJson ? await request.json() : Object.fromEntries((await request.formData()).entries());
  } catch {
    return apiError("Unable to read the submission. Please try again.", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return apiError("Invalid submission.", 400);
  for (const key of ["name", "email", "message"]) body[key] = String(body[key] || "").trim();

  if (body.website || !body.name || !validEmail(body.email) || !body.message) {
    return apiError("Name, valid email and message are required.", 400);
  }
  if ([body.name, body.email, body.company, body.phone, body.product, body.message, body.country, body.buyerType, body.estimatedQuantity, body.requiredSpecification, body.productModel, body.pageUrl].some((value) => String(value || "").length > 4000)) {
    return apiError("Inquiry contains an invalid field length.", 400);
  }
  let saved;
  try {
    if (!(await allowInquiry(request))) return apiError("Too many submissions. Please try again later.", 429);
    saved = await saveInquiry({
      ...body,
      userAgent: request.headers.get("user-agent") || "",
      visitorCountry: request.headers.get("x-vercel-ip-country") || ""
    }, inquirySubmissionId(request.headers.get("idempotency-key"), body));
  } catch (error) {
    console.error("[inquiry] Unable to persist inquiry:", error?.code || error?.name || "unknown-error");
    return apiError("We could not save your inquiry. Please try again or contact us on WhatsApp.", 503);
  }
  const { inquiry, created } = saved;
  if (created) {
    after(async () => {
      try {
        await appendInquiryActivity({ inquiryId: inquiry.id, type: "received", actor: "website", summary: "Website inquiry received" });
      } catch (error) {
        console.error("[inquiry] Unable to log receipt:", inquiry.id, error?.code || error?.name || "unknown-error");
      }
      let notification;
      try {
        notification = await sendAdminInquiryEmail(inquiry);
      } catch (error) {
        console.error("[inquiry] Email notification failed:", inquiry.id, error?.code || error?.name || "unknown-error");
        notification = { sent: false, reason: "email-send-failed" };
      }
      try {
        await recordInquiryNotification({ inquiryId: inquiry.id, ...notification });
      } catch (error) {
        console.error("[inquiry] Notification audit logging failed:", inquiry.id, error?.code || error?.name || "unknown-error");
      }
    });
  }

  if (!isJson) {
    return Response.redirect(new URL("/message?success=1", request.url), 303);
  }
  return apiOk({ inquiry: { id: inquiry.id }, notification: { status: created ? "pending" : "existing" } }, { status: created ? 201 : 200 });
}
