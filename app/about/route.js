import { publicHtmlResponse } from "@/lib/staticHtml";

export const dynamic = "force-dynamic";

export async function GET(request) {
  return publicHtmlResponse("about/index.html", { canonicalPath: new URL(request.url).pathname });
}
