import { getSitemapIndexXml } from "@/lib/sitemapService";

export const dynamic = "force-dynamic";

export async function GET() {
  return xmlResponse(await getSitemapIndexXml());
}

function xmlResponse(body) {
  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "s-maxage=900, stale-while-revalidate=3600"
    }
  });
}
