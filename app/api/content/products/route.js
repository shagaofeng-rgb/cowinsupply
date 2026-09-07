import { apiOk } from "@/lib/adminApi";
import { getCmsItems, paginateItems } from "@/lib/cmsStore";
import { isCanonicalProductRecord } from "@/lib/catalogTaxonomy";
import { publicProduct } from "@/lib/publicContent";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const items = (await getCmsItems("product")).filter(isCanonicalProductRecord);
  const result = paginateItems(items, {
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
    q: searchParams.get("q"),
    status: ""
  });
  return apiOk({ ...result, items: result.items.map(publicProduct) });
}
