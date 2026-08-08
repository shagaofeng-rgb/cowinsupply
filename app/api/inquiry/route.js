import { apiError, apiOk } from "@/lib/adminApi";
import { saveInquiry } from "@/lib/cmsStore";
import { sendAdminInquiryEmail } from "@/lib/emailService";
import { allowInquiry } from "@/lib/inquiryRateLimit";

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

export async function POST(request) {
  const contentType = request.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());

  if (body.website || !body.name || !validEmail(body.email) || !body.message) {
    return apiError("Name, valid email and message are required.", 400);
  }
  if ([body.name, body.email, body.company, body.phone, body.product, body.message, body.country, body.buyerType, body.estimatedQuantity, body.requiredSpecification, body.productModel, body.pageUrl].some((value) => String(value || "").length > 4000)) {
    return apiError("Inquiry contains an invalid field length.", 400);
  }
  if (!(await allowInquiry(request))) {
    return apiError("Too many submissions. Please try again later.", 429);
  }

  const inquiry = await saveInquiry(body);
  let notification = { sent: false };

  try {
    notification = await sendAdminInquiryEmail(inquiry);
  } catch (error) {
    console.error("[inquiry] Email notification failed:", error?.message || error);
    notification = { sent: false, reason: "email-send-failed" };
  }

  if (!isJson) {
    return Response.redirect(new URL("/message/index.html?success=1", request.url), 303);
  }
  return apiOk({ inquiry, notification }, { status: 201 });
}
