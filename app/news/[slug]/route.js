import { publicHtmlResponse } from "@/lib/staticHtml";
import { getCmsItems, getSeoGoneUrls } from "@/lib/cmsStore";
import { renderNewsDetailHtml } from "@/lib/newsRendering";
import { LEGACY_NEWS_REDIRECTS } from "@/lib/seoContentPolicy";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { slug } = await params;
  const cleanSlug = String(slug || "").replace(/\.html$/, "");
  const redirectTarget = LEGACY_NEWS_REDIRECTS.get(cleanSlug);
  if (redirectTarget) return Response.redirect(new URL(redirectTarget, request.url), 301);
  if ((await getSeoGoneUrls()).includes(`/news/${cleanSlug}`)) return new Response("Gone", { status: 410 });
  const [news, products] = await Promise.all([getCmsItems("news"), getCmsItems("product")]);
  const article = news.find((item) => item.slug === cleanSlug);
  if (article) {
    return new Response(renderNewsDetailHtml({ article, products, relatedNews: news }), {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "s-maxage=300, stale-while-revalidate=3600" }
    });
  }
  return publicHtmlResponse(`news/${slug}`, { canonicalPath: new URL(request.url).pathname });
}
