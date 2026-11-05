import { getCmsItems } from "@/lib/cmsStore";
import { getTaxonomyItem, isCanonicalProductRecord, LEGACY_CATEGORY_REDIRECTS } from "@/lib/catalogTaxonomy";
import { htmlResponse, notFoundResponse } from "@/lib/interiorRendering";
import { renderProductCategoryHtml } from "@/lib/productRendering";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { category } = await params;
  const legacyTarget = LEGACY_CATEGORY_REDIRECTS[category];
  if (legacyTarget) return Response.redirect(new URL(legacyTarget, request.url), 301);
  const config = getTaxonomyItem(category);
  if (!config) return notFoundResponse();
  const products = (await getCmsItems("product")).filter(isCanonicalProductRecord);
  const selected = products.filter((item) => item.categorySlug === category || getTaxonomyItem(item.categorySlug)?.parent === category);
  return htmlResponse(renderProductCategoryHtml({ config, products: selected }));
}
