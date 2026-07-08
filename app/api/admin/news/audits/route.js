import { apiOk, requireAdminApi } from "@/lib/adminApi";
import { getNewsPublicationAudits } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  return apiOk({ audits: await getNewsPublicationAudits() });
}
