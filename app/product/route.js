import { getCmsItems } from "@/lib/cmsStore";
import { isCanonicalProductRecord } from "@/lib/catalogTaxonomy";
import { renderProductListHtml } from "@/lib/productRendering";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const filters = new URL(request.url).searchParams;
  return new Response(renderProductListHtml({
    products: (await getCmsItems("product")).filter(isCanonicalProductRecord),
    query: (filters.get("q") || "").trim().slice(0, 120),
    category: filters.get("category") || ""
  }), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=0, must-revalidate" }
  });
}
