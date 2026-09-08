import { DataTable, EmptyPanel, MetricCard, SyncStrip } from "@/components/admin/DataPanels";
import RangeBox from "@/components/admin/RangeBox";
import { getAdminDateRange } from "@/lib/adminDateRange";
import { getAnalyticsReport, getSyncStatus } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function TrafficPage({ searchParams }) {
  const range = getAdminDateRange(await searchParams);
  const [analytics, sync] = await Promise.all([getAnalyticsReport(range), getSyncStatus()]);

  return (
    <>
      <header className="data-hero">
        <div>
          <small>流量分析</small>
          <h1>来源渠道与设备分析</h1>
          <p>了解海外客户从哪里进入网站、使用什么设备，以及访问最前关注了哪些页面。</p>
        </div>
        <RangeBox />
      </header>
      <SyncStrip sync={sync} />
      <section className="metric-grid">
        <MetricCard label="页面浏览" value={analytics.pv} hint="所选时间范围" />
        <MetricCard label="独立访客" value={analytics.uv} hint="按访客标识去重" />
        <MetricCard label="客户询盘" value={analytics.inquiries} hint="真实表单提交" />
        <MetricCard label="转化率" value={`${analytics.conversionRate}%`} hint="询盘 / 独立访客" />
      </section>
      <section className="data-panel">
        <small>每日趋势</small>
        <h2>每日浏览量变化</h2>
        <div className="mini-chart">
          {analytics.daily.map((item) => (
            <span key={item.day} style={{ "--h": `${Math.max(8, item.pv * 24)}px` }}>
              <i />
              <b>{item.pv}</b>
              <em>{item.day}</em>
            </span>
          ))}
        </div>
      </section>
      <section className="data-grid-four">
        <DataTable columns={["渠道", "访问量"]} rows={analytics.sources.map((item) => ({ cells: [item.key, item.count] }))} empty="暂无渠道数据。" />
        <DataTable columns={["重点页面", "访问量"]} rows={analytics.topPages.map((item) => ({ cells: [item.key, item.count] }))} empty="暂无页面数据。" />
        <DataTable columns={["国家 / 地区", "访问量"]} rows={analytics.countries.map((item) => ({ cells: [item.key || "未知", item.count] }))} empty="暂无国家地区数据。" />
        <DataTable columns={["设备", "访问量"]} rows={analytics.devices.map((item) => ({ cells: [item.key, item.count] }))} empty="暂无设备数据。" />
      </section>
      <EmptyPanel title="营销归因" eyebrow="转化" />
    </>
  );
}
