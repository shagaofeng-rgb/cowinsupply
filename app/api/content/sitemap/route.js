import { apiOk } from "@/lib/adminApi";
import { getCmsItems } from "@/lib/cmsStore";
import { isCanonicalProductRecord } from "@/lib/catalogTaxonomy";

export const dynamic = "force-dynamic";

export async function GET() {
  const [products, news] = await Promise.all([getCmsItems("product"), getCmsItems("news")]);
  return apiOk({
    products: products.filter(isCanonicalProductRecord).map((item) => ({
      title: item.title,
      url: `/product/${item.slug}.html`,
      updatedAt: item.updatedAt || item.createdAt
    })),
    news: news.map((item) => ({
      title: item.title,
      url: `/news/${item.slug}`,
      updatedAt: item.updatedAt || item.createdAt
    }))
  });
}
