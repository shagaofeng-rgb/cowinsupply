import { publicHtmlResponse } from "@/lib/staticHtml";

export const dynamic = "force-dynamic";

export async function GET(request) {
  return publicHtmlResponse("product/index.html", { canonicalPath: new URL(request.url).pathname });
}
