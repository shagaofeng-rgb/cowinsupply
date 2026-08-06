import { publicHtmlResponse } from "@/lib/staticHtml";
import { POST as publishBlogArticle } from "@/app/api/webhook/send_article/route";

export const dynamic = "force-dynamic";

export async function GET(request) {
  return publicHtmlResponse("index.html", { canonicalPath: new URL(request.url).pathname });
}

// The custom-framework plugin verifies and publishes against the domain root.
// Keep the public homepage GET behavior intact and forward only POST requests.
export async function POST(request) {
  return publishBlogArticle(request);
}
