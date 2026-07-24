import { getSitemapGroupXml } from "@/lib/sitemapService";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response((await getSitemapGroupXml("news-sitemap.xml")) || "", {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "s-maxage=900, stale-while-revalidate=3600"
    }
  });
}
