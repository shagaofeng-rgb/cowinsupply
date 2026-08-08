import { getCmsItems } from "@/lib/cmsStore";
import { categoryPath, getTaxonomyItem, LEGACY_CATEGORY_REDIRECTS } from "@/lib/catalogTaxonomy";
import { renderProductListHtml } from "@/lib/productRendering";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { category } = await params;
  const legacyTarget = LEGACY_CATEGORY_REDIRECTS[category];
  if (legacyTarget) return Response.redirect(new URL(legacyTarget, request.url), 301);
  const config = getTaxonomyItem(category);
  if (!config) return new Response("Not found", { status: 404 });
  const path = categoryPath(category);
  const products = await getCmsItems("product");
  const selected = products.filter((item) => item.categorySlug === category || getTaxonomyItem(item.categorySlug)?.parent === category);
  return new Response(renderProductListHtml({
    products: selected,
    title: config.name,
    description: config.description,
    eyebrow: "Product category",
    canonical: `${new URL(request.url).origin}/products/${category}`,
    categoryPath: path
  }), { headers: { "content-type": "text/html; charset=utf-8" } });
}
