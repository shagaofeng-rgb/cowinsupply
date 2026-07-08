import { publicHtmlResponse } from "@/lib/staticHtml";
import { getCmsItems } from "@/lib/cmsStore";
import { renderNewsDetailHtml } from "@/lib/newsRendering";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { slug } = await params;
  const cleanSlug = String(slug || "").replace(/\.html$/, "");
  const [news, products] = await Promise.all([getCmsItems("news"), getCmsItems("product")]);
  const article = news.find((item) => item.slug === cleanSlug);
  if (article) {
    return new Response(renderNewsDetailHtml({ article, products, relatedNews: news }), {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "s-maxage=300, stale-while-revalidate=3600" }
    });
  }
  return publicHtmlResponse(`news/${slug}`);
}
