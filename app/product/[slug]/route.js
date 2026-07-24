import { publicHtmlResponse } from "@/lib/staticHtml";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { slug } = await params;
  return publicHtmlResponse(`product/${slug}`, { canonicalPath: new URL(request.url).pathname });
}
