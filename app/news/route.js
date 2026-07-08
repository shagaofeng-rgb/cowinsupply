import { getCmsItems } from "@/lib/cmsStore";
import { renderNewsListHtml } from "@/lib/newsRendering";

export const dynamic = "force-dynamic";

export async function GET() {
  const [news, products] = await Promise.all([getCmsItems("news"), getCmsItems("product")]);
  return new Response(renderNewsListHtml({ news, products }), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "s-maxage=300, stale-while-revalidate=3600" }
  });
}
