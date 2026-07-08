import { getCmsItems } from "@/lib/cmsStore";
import { renderNewsFeedXml } from "@/lib/newsRendering";

export const dynamic = "force-dynamic";

export async function GET() {
  const news = await getCmsItems("news");
  return new Response(renderNewsFeedXml(news), {
    headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "s-maxage=300, stale-while-revalidate=3600" }
  });
}
