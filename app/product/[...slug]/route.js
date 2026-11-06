import { getCmsCollections } from "@/lib/cmsStore";
import { canonicalProductSlug, isCanonicalProductRecord } from "@/lib/catalogTaxonomy";
import { notFoundResponse } from "@/lib/interiorRendering";
import { uniqueNews } from "@/lib/newsDuplicates";
import { newsMatchesProduct } from "@/lib/newsRendering";
import { renderProductDetailHtml } from "@/lib/productRendering";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { slug: parts } = await params;
  const rawSlug = Array.isArray(parts) ? parts.join("/") : String(parts || "");
  if (/^index(?:\.html)?$/i.test(rawSlug)) {
    return Response.redirect(new URL("/product", request.url), 308);
  }
  if (!/\.html$/i.test(rawSlug)) {
    return Response.redirect(new URL(`/product/${encodeURIComponent(rawSlug)}.html`, request.url), 301);
  }
  const slug = rawSlug.replace(/\.html$/i, "");
  const canonicalSlug = canonicalProductSlug(slug);
  if (canonicalSlug !== slug) return Response.redirect(new URL(`/product/${encodeURIComponent(canonicalSlug)}.html`, request.url), 301);
  const { product: records, news } = await getCmsCollections(["product", "news"]);
  const products = records.filter(isCanonicalProductRecord);
  const product = products.find((item) => item.slug === slug);
  if (!product) return notFoundResponse();
  const relatedProducts = products.filter(item => item.slug !== slug && item.categorySlug === product.categorySlug).slice(0, 3);
  const relatedNews = uniqueNews(news).filter(item => newsMatchesProduct(item, product)).slice(0, 3);
  return new Response(renderProductDetailHtml({ product, relatedProducts, relatedNews }), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=0, must-revalidate" }
  });
}
