import { renderContact } from "@/lib/interiorInfo";
import { htmlResponse } from "@/lib/interiorRendering";

export const dynamic = "force-dynamic";

export function GET() {
  return htmlResponse(renderContact(), { "cache-control": "public, max-age=0, must-revalidate" });
}
