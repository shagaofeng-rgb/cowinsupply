import { redirect } from "next/navigation";
import { appendAuditLog, appendSyncRun, getAnalyticsReport, getSeoReport } from "@/lib/cmsStore";
import { requireAdminApi } from "@/lib/adminApi";

export async function POST(request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const [analytics, seo] = await Promise.all([getAnalyticsReport(), getSeoReport()]);
  await appendSyncRun({
    source: "manual",
    status: "checked",
    processed: 0,
    message: `已重新读取访问记录${analytics.reliable ? `（${analytics.pv} 条）` : "（未配置可靠存储）"}；GSC ${seo.gscConnected ? "已连通" : seo.gscUnavailable ? "所选日期暂无数据" : "未连通"}。未导入或修改业务数据。`
  });
  await appendAuditLog({ action: "check_data_status", module: "sync", target: "analytics-gsc" });
  redirect(request.headers.get("referer") || "/admin/sync");
}
