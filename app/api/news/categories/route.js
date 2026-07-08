import { apiOk } from "@/lib/adminApi";
import { getCmsItems } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const news = await getCmsItems("news");
  const categories = [...new Set(news.map((item) => item.category || "Industry News"))].sort();
  return apiOk({ categories });
}
