import { getCmsItems } from "@/lib/cmsStore";
import { renderNewsFeedXml } from "@/lib/newsRendering";
import { uniqueNews } from "@/lib/newsDuplicates";

export const dynamic = "force-dynamic";

export async function GET() {
  const news = await getCmsItems("news");
  return new Response(renderNewsFeedXml(uniqueNews(news)), {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "s-maxage=300, stale-while-revalidate=3600"
    }
  });
}
