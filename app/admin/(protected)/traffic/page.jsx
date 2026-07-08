import { DataTable, EmptyPanel, MetricCard, RangeBox, SyncStrip } from "@/components/admin/DataPanels";
import { getAnalyticsReport, getSyncStatus } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function TrafficPage() {
  const [analytics, sync] = await Promise.all([getAnalyticsReport(), getSyncStatus()]);

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
        <MetricCard label="平均停留" value="0s" hint="页面参与度" />
        <MetricCard label="跳出率" value="0%" hint="估算值" />
        <MetricCard label="国家地区" value={analytics.countries.length} hint="活跃市场" />
        <MetricCard label="设备类型" value={analytics.devices.length} hint="访问设备" />
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
        <DataTable columns={["平台", "访问量"]} rows={analytics.sources.map((item) => ({ cells: [item.key, item.count] }))} empty="暂无平台数据。" />
        <DataTable columns={["国家 / 地区", "访问量"]} rows={analytics.countries.map((item) => ({ cells: [item.key || "未知", item.count] }))} empty="暂无国家地区数据。" />
        <DataTable columns={["设备", "访问量"]} rows={analytics.devices.map((item) => ({ cells: [item.key, item.count] }))} empty="暂无设备数据。" />
      </section>
      <EmptyPanel title="营销归因" eyebrow="转化" />
    </>
  );
}
