import { publicHtmlResponse } from "@/lib/staticHtml";

export const dynamic = "force-dynamic";

export async function GET() {
  return publicHtmlResponse("about/index.html");
}
