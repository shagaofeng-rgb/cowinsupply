import { apiError, apiOk, requireAdminApi } from "@/lib/adminApi";
import { archiveCandidate, getNewsAutomationDashboard, runNewsDaily, runNewsIngest, updateNewsAutomationConfig, withdrawNewsArticle } from "@/lib/newsAutomationV2";

export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  return apiOk(await getNewsAutomationDashboard());
}

export async function POST(request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const body = await request.json().catch(() => ({}));
  try {
    if (body.action === "run" || body.action === "dry-run") return apiOk(await runNewsDaily({ trigger: "admin", dryRun: body.action === "dry-run" }));
    if (body.action === "ingest" || body.action === "ingest-dry-run") return apiOk(await runNewsIngest({ trigger: "admin", dryRun: body.action === "ingest-dry-run" }));
    if (body.action === "config") return apiOk(await updateNewsAutomationConfig(body.config || {}));
    if (body.action === "withdraw") return apiOk(await withdrawNewsArticle(String(body.slug || "")));
    if (body.action === "archive") return apiOk(await archiveCandidate(String(body.id || "")));
    return apiError("Unsupported News automation action", 400);
  } catch (error) {
    return apiError(String(error?.message || "News automation request failed").slice(0, 180), 400);
  }
}
