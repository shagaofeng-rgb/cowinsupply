import { apiOk } from "@/lib/adminApi";
import { getCmsItems } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { id } = await params;
  const [products, news] = await Promise.all([getCmsItems("product"), getCmsItems("news")]);
  const product = products.find((item) => item.slug === id || item.id === id);
  if (!product) return apiOk({ product: null, news: [] });
  const related = news.filter((item) => (item.relatedProducts || []).some((entry) => entry.productSlug === product.slug || entry.productId === product.id));
  return apiOk({ product, news: related });
}
