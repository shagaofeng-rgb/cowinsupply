import { apiError, apiOk } from "@/lib/adminApi";
import { getCmsItems } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { slug } = await params;
  const items = await getCmsItems("news");
  const item = items.find((entry) => entry.slug === slug);
  if (!item) return apiError("News item not found", 404);
  return apiOk(item);
}
