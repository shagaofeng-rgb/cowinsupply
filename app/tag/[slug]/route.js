import { publicHtmlResponse } from "@/lib/staticHtml";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { slug } = await params;
  return publicHtmlResponse(`tag/${slug}/index.html`, { canonicalPath: new URL(request.url).pathname });
}
