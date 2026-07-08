import { redirect } from "next/navigation";
import { appendAuditLog, appendSyncRun, getAnalyticsReport } from "@/lib/cmsStore";
import { requireAdminApi } from "@/lib/adminApi";

export async function POST(request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const analytics = await getAnalyticsReport();
  await appendSyncRun({
    source: "manual",
    status: "success",
    processed: analytics.pv,
    message: "已刷新访问分析、SEO 检测和内容索引状态。"
  });
  await appendAuditLog({ action: "manual_sync", module: "sync", target: "analytics-seo-content" });
  redirect(request.headers.get("referer") || "/admin/sync");
}
