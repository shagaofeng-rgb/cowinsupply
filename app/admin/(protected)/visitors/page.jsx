import { DataTable, MetricCard, RangeBox } from "@/components/admin/DataPanels";
import { getAnalyticsReport } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function VisitorsPage() {
  const analytics = await getAnalyticsReport();
  return (
    <>
      <header className="data-hero">
        <div>
          <small>访客记录</small>
          <h1>访客记录</h1>
          <p>查看真实访问事件、来源、设备、访问页面和访问时间。</p>
        </div>
        <RangeBox />
      </header>
      <section className="metric-grid">
        <MetricCard label="访问事件" value={analytics.pv} hint="PV" />
        <MetricCard label="独立访客" value={analytics.uv} hint="UV" />
        <MetricCard label="来源类型" value={analytics.sources.length} hint="渠道" />
        <MetricCard label="设备类型" value={analytics.devices.length} hint="设备" />
      </section>
      <DataTable
        columns={["时间", "页面", "来源", "设备", "地区", "语言"]}
        rows={analytics.recent.map((item) => ({
          id: item.id,
          cells: [new Date(item.createdAt).toLocaleString("zh-CN"), item.path, item.source, item.device, item.country || "未知", item.language || "未知"]
        }))}
        empty="暂无访客记录，前台收到访问后自动写入。"
      />
    </>
  );
}
