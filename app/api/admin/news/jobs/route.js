import { apiOk, requireAdminApi } from "@/lib/adminApi";
import { getNewsJobs } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  return apiOk({ jobs: await getNewsJobs() });
}
