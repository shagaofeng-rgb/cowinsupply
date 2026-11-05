import { renderInquiryStatus } from "@/lib/interiorInfo";
import { htmlResponse } from "@/lib/interiorRendering";

export const dynamic = "force-dynamic";

export function GET(request) {
  const success = new URL(request.url).searchParams.get("success") === "1";
  return htmlResponse(renderInquiryStatus(success), { "cache-control": "no-store" });
}
