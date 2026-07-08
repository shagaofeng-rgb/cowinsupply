import { getCmsItems } from "@/lib/cmsStore";
import { renderGeneratedCoverSvg } from "@/lib/newsRendering";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { slug } = await params;
  const news = await getCmsItems("news", { includeInactive: true });
  const article = news.find((item) => item.slug === slug);
  return new Response(renderGeneratedCoverSvg(article?.title || "Cowin Supply News"), {
    headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public, max-age=86400, immutable" }
  });
}
