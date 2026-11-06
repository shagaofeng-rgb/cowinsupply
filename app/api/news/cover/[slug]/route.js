import { getCmsItems } from "@/lib/cmsStore";
import { renderGeneratedCoverSvg } from "@/lib/newsRendering";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { slug } = await params;
  const news = await getCmsItems("news");
  const article = news.find((item) => item.slug === slug);
  if (!article) return new Response("Not found", { status: 404, headers: { "x-robots-tag": "noindex" } });
  return new Response(renderGeneratedCoverSvg(article.title), {
    headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public, max-age=3600", "x-robots-tag": "noindex" }
  });
}
