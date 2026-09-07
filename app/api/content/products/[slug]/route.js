import { apiError, apiOk } from "@/lib/adminApi";
import { getCmsItems } from "@/lib/cmsStore";
import { canonicalProductSlug, isCanonicalProductRecord } from "@/lib/catalogTaxonomy";
import { publicProduct } from "@/lib/publicContent";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { slug } = await params;
  const canonicalSlug = canonicalProductSlug(slug);
  const items = (await getCmsItems("product")).filter(isCanonicalProductRecord);
  const item = items.find((entry) => entry.slug === canonicalSlug);
  if (!item) return apiError("Product not found", 404);
  return apiOk({ ...publicProduct(item), canonicalSlug });
}
