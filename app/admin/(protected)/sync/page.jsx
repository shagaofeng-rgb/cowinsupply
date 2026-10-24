import { DataTable, MetricCard } from "@/components/admin/DataPanels";
import AdminListControls from "@/components/admin/AdminListControls";
import Pagination from "@/components/admin/Pagination";
import RangeBox from "@/components/admin/RangeBox";
import { getAdminDateRange } from "@/lib/adminDateRange";
import { getSyncStatus, paginateItems } from "@/lib/cmsStore";
import { getSitemapRuns } from "@/lib/sitemapService";

export const dynamic = "force-dynamic";

export default async function SyncPage({ searchParams }) {
  const params = await searchParams;
  const range = getAdminDateRange(params);
  const [sync, sitemapRuns] = await Promise.all([getSyncStatus(range), getSitemapRuns()]);
  const latestGoogleRun = sitemapRuns.findLast((run) => run.gscSubmit?.attempted);
  const runs = paginateItems(sync.runs, { ...params, from: "", to: "" });
  return (
    <>
      <header className="data-hero">
        <div>
          <small>数据同步</small>
          <h1>数据同步</h1>
          <p>查看访问采集、Search Console 与后台任务的配置及历史记录。手动检查只重新读取状态，不导入或修改业务数据。</p>
        </div>
        <div className="admin-head-actions"><RangeBox /><form action="/api/admin/sync" method="post"><button className="admin-button" type="submit">重新检查状态</button></form></div>
      </header>
      <section className="metric-grid">
        <MetricCard label="前端采集" value={sync.trackingState === "active" ? "有访问记录" : "等待首条记录"} hint="站内访问事件" />
        <MetricCard label="GSC" value={sync.gscConfigured ? "已配置" : "未配置"} hint="搜索表现" />
        <MetricCard label="GA 属性" value={sync.gaConfigured ? "已配置" : "未配置"} hint="仅表示环境变量状态" />
        <MetricCard label="Cron 密钥" value={sync.cronConfigured ? "已配置" : "未配置"} hint="仅表示环境变量状态" />
        <MetricCard
          label="Google Sitemap 提交"
          value={latestGoogleRun ? latestGoogleRun.gscSubmit.success ? "成功" : "失败" : "暂无运行记录"}
          hint={latestGoogleRun ? `${new Date(latestGoogleRun.completedAt).toLocaleString("zh-CN", { hour12: false, timeZone: "Asia/Shanghai" })} · ${latestGoogleRun.gscSubmit.success ? latestGoogleRun.trigger : latestGoogleRun.gscSubmit.error || latestGoogleRun.gscSubmit.reason || latestGoogleRun.trigger}` : "计划每周一 12:00（北京时间）"}
        />
      </section>
      <DataTable
        title="检查与同步历史"
        columns={["时间", "来源", "状态", "处理量", "说明"]}
        rows={runs.items.map((item) => ({ cells: [new Date(item.createdAt).toLocaleString("zh-CN", { hour12: false, timeZone: "Asia/Shanghai" }), item.source, item.status, item.processed, item.message] }))}
        empty="暂无同步日志。"
      />
      <AdminListControls action="/admin/sync" keyword={params?.q} pageSize={runs.pageSize} range={range} />
      <Pagination basePath="/admin/sync" page={runs.page} pageSize={runs.pageSize} total={runs.total} query={params} />
    </>
  );
}
