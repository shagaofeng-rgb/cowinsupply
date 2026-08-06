import { apiError, requireAdminApi } from "@/lib/adminApi";

export const dynamic = "force-dynamic";

export async function POST() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  return apiError("Automated News publishing is disabled. Review and publish approved drafts through the CMS content workflow.", 410);
}
