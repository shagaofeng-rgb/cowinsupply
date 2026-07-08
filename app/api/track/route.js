import { apiOk } from "@/lib/adminApi";
import { saveVisitEvent } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const event = await saveVisitEvent({
      ...body,
      userAgent: request.headers.get("user-agent") || "",
      country: request.headers.get("x-vercel-ip-country") || ""
    });
    return apiOk({ id: event.id });
  } catch {
    return apiOk({ skipped: true });
  }
}
