import { apiOk, requireAdminApi } from "@/lib/adminApi";
import { runNewsAutomation } from "@/lib/newsAutomation";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const job = await runNewsAutomation({ trigger: "admin_generate" });
  if ((request.headers.get("accept") || "").includes("text/html")) redirect(request.headers.get("referer") || "/admin/news");
  return apiOk({ job });
}
