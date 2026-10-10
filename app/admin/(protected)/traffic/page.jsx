import { DataTable, MetricCard, SyncStrip } from "@/components/admin/DataPanels";
import RangeBox from "@/components/admin/RangeBox";
import TrafficTrend from "@/components/admin/TrafficTrend";
import { getAdminDateRange } from "@/lib/adminDateRange";
import { getAnalyticsReport, getSyncStatus } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function TrafficPage({ searchParams }) {
  const range = getAdminDateRange(await searchParams);
  const [analytics, sync] = await Promise.all([getAnalyticsReport(range), getSyncStatus()]);
  const pageHref = `/admin/pages?${new URLSearchParams({ range: range.range, from: range.from, to: range.to })}`;

  return (
    <>
      <header className="data-hero">
        <div>
          <small>流量分析</small>
          <h1>流量分析</h1>
          <p>按所选时间查看站内访问事件、来源渠道、设备和热门页面。</p>
        </div>
        <RangeBox />
      </header>
      <SyncStrip sync={sync} />
      <section className="metric-grid">
        <MetricCard label="页面浏览 (PV)" value={analytics.reliable ? analytics.pv : null} hint="站内访问事件" />
        <MetricCard label="独立访客 (UV)" value={analytics.reliable ? analytics.uv : null} hint="按访客标识去重" />
        <MetricCard label="客户询盘" value={analytics.reliable ? analytics.inquiries : null} hint="后台表单记录" />
        <MetricCard label="询盘 / 页面浏览" value={analytics.reliable && analytics.conversionRate !== null ? `${analytics.conversionRate}%` : null} hint="询盘数 ÷ PV；非访客转化率" />
      </section>
      <TrafficTrend series={analytics.reliable ? analytics.daily : []} range={range} title="页面浏览趋势" />
      <section className="data-grid-four">
        <DataTable title="访问来源" columns={["来源", "PV"]} rows={analytics.reliable ? analytics.sources.map((item) => ({ cells: [item.key, item.count] })) : []} empty="暂无可靠的来源记录。" />
        <DataTable title="热门页面" href={pageHref} columns={["页面", "PV"]} rows={analytics.reliable ? analytics.topPages.map((item) => ({ cells: [item.key, item.count] })) : []} empty="暂无可靠的页面记录。" />
        <DataTable title="国家 / 地区" columns={["地区", "PV"]} rows={analytics.reliable ? analytics.countries.map((item) => ({ cells: [item.key || "未知", item.count] })) : []} empty="暂无可靠的地区记录。" />
        <DataTable title="访问设备" columns={["设备", "PV"]} rows={analytics.reliable ? analytics.devices.map((item) => ({ cells: [item.key, item.count] })) : []} empty="暂无可靠的设备记录。" />
      </section>
      <p className="admin-data-footnote">来源：站内访问事件，覆盖范围：{analytics.coverage}。地区可能缺失；访问事件可能包含机器人流量，不等同于独立真人会话。</p>
    </>
  );
}
