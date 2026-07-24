import { apiOk } from "@/lib/adminApi";
import { getCmsItems } from "@/lib/cmsStore";
import { filterNews, paginateNews } from "@/lib/newsQuery";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const items = await getCmsItems("news");
  const filters = Object.fromEntries(searchParams.entries());
  return apiOk(paginateNews(filterNews(items, filters), filters));
}
