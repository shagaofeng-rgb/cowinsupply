import { getSitemapGroupXml } from "@/lib/sitemapService";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { name } = await params;
  const xml = await getSitemapGroupXml(name);
  if (!xml) return new Response("Not found", { status: 404 });
  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "s-maxage=900, stale-while-revalidate=3600"
    }
  });
}
