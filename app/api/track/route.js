import { apiOk } from "@/lib/adminApi";
import { saveVisitEvent } from "@/lib/cmsStore";
import { apiError, apiOk as successResponse } from "@/lib/adminApi";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const event = await saveVisitEvent({
      ...body,
      userAgent: request.headers.get("user-agent") || "",
      country: request.headers.get("x-vercel-ip-country") || ""
    });
    return successResponse({ id: event.id });
  } catch (error) {
    console.error("[tracking] Visit event could not be recorded:", error?.message || error);
    return apiError("Tracking event could not be recorded.", 500);
  }
}
