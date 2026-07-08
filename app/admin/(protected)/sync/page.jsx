import { DataTable, MetricCard } from "@/components/admin/DataPanels";
import { getSyncStatus } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function SyncPage() {
  const sync = await getSyncStatus();
  return (
    <>
      <header className="data-hero">
        <div>
          <small>数据同步</small>
          <h1>数据同步</h1>
          <p>查看前端采集、Search Console、访问分析和后台任务同步状态。</p>
        </div>
        <form action="/api/admin/sync" method="post">
          <button className="admin-button" type="submit">手动执行同步</button>
        </form>
      </header>
      <section className="metric-grid">
        <MetricCard label="前端采集" value={sync.trackingConfigured ? "已接入" : "未接入"} hint="访问事件" />
        <MetricCard label="GSC" value={sync.gscConfigured ? "已配置" : "未配置"} hint="搜索表现" />
        <MetricCard label="GA" value={sync.gaConfigured ? "已配置" : "未配置"} hint="分析数据" />
        <MetricCard label="Cron" value={sync.cronConfigured ? "已配置" : "未配置"} hint="后台任务" />
      </section>
      <DataTable
        columns={["时间", "数据源", "状态", "处理量", "说明"]}
        rows={sync.runs.map((item) => ({ cells: [new Date(item.createdAt).toLocaleString("zh-CN"), item.source, item.status, item.processed, item.message] }))}
        empty="暂无同步日志。"
      />
    </>
  );
}
