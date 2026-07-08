import { apiOk, requireAdminApi } from "@/lib/adminApi";
import { getAdminSummary } from "@/lib/cmsStore";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  return apiOk(await getAdminSummary());
}
