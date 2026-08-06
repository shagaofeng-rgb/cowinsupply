import { apiError, apiOk } from "@/lib/adminApi";
import { getCmsItems } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { slug } = await params;
  const item = (await getCmsItems("blog")).find((entry) => entry.slug === slug);
  return item ? apiOk(item) : apiError("Blog article not found", 404);
}
