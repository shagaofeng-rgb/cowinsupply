import { renderAbout } from "@/lib/interiorInfo";
import { htmlResponse } from "@/lib/interiorRendering";

export const dynamic = "force-dynamic";

export function GET() {
  return htmlResponse(renderAbout(), { "cache-control": "public, max-age=0, must-revalidate" });
}
