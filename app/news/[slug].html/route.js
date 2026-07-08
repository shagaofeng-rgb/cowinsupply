import { getCmsItems } from "@/lib/cmsStore";
import { renderNewsDetailHtml } from "@/lib/newsRendering";
import { publicHtmlResponse } from "@/lib/staticHtml";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { slug } = await params;
  const [news, products] = await Promise.all([getCmsItems("news"), getCmsItems("product")]);
  const article = news.find((item) => item.slug === slug);
  if (article) {
    return new Response(renderNewsDetailHtml({ article, products, relatedNews: news }), {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "s-maxage=300, stale-while-revalidate=3600" }
    });
  }
  return publicHtmlResponse(`news/${slug}.html`);
}
