import { apiOk } from "@/lib/adminApi";
import { getCmsItems } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const [products, news] = await Promise.all([getCmsItems("product"), getCmsItems("news")]);
  return apiOk({
    products: products.map((item) => ({
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
