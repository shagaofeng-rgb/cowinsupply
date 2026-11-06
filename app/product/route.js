import { getStorefrontCollections } from "@/lib/cmsStore";
import { isCanonicalProductRecord } from "@/lib/catalogTaxonomy";
import { renderProductListHtml } from "@/lib/productRendering";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const filters = new URL(request.url).searchParams;
  const query = (filters.get("q") || "").trim().slice(0, 120);
  const category = filters.get("category") || "";
  try {
    const started = performance.now();
    const { product } = await getStorefrontCollections();
    const catalogTiming = `catalog;dur=${Math.round(performance.now() - started)}`;
    return new Response(renderProductListHtml({
      products: product.filter(isCanonicalProductRecord),
      query,
      category
    }), {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=0, must-revalidate",
        "server-timing": catalogTiming,
        ...(!query && !category ? { "Vercel-CDN-Cache-Control": "public, s-maxage=30" } : {})
      }
    });
  } catch (error) {
    console.error("[product-catalog] Unable to render catalog:", error?.code || error?.name || "unknown-error");
    return new Response("Product catalog temporarily unavailable. Please try again shortly.", {
      status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "30" }
    });
  }
}
