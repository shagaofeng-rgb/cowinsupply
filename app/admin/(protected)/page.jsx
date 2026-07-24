import { DataTable, EmptyPanel, MetricCard, SyncStrip } from "@/components/admin/DataPanels";
import RangeBox from "@/components/admin/RangeBox";
import { getAdminDateRange } from "@/lib/adminDateRange";
import { getAnalyticsReport, getCmsItems, getSyncStatus } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({ searchParams }) {
  const range = getAdminDateRange(await searchParams);
  const [analytics, products, news, sync] = await Promise.all([
    getAnalyticsReport(range),
    getCmsItems("product", { includeInactive: true }),
    getCmsItems("news", { includeInactive: true }),
    getSyncStatus()
  ]);

  return (
    <>
      <header className="data-hero">
        <div>
          <small>网站数据</small>
          <h1>数据总览</h1>
          <p>查看 Cowin Supply 当前访问、询盘、产品、新闻和同步状态。</p>
        </div>
        <RangeBox />
      </header>

      <SyncStrip sync={sync} />

      <section className="metric-grid">
        <MetricCard label="今日访问量" value={analytics.pv} hint="PV" />
        <MetricCard label="独立访客" value={analytics.uv} hint="UV" />
        <MetricCard label="产品浏览" value={analytics.productViews} hint="产品页面" />
        <MetricCard label="新闻浏览" value={analytics.newsViews} hint="新闻页面" />
        <MetricCard label="表单提交" value={analytics.inquiries} hint="客户询盘" />
        <MetricCard label="转化率" value={`${analytics.conversionRate}%`} hint="询盘 / PV" />
        <MetricCard label="产品内容" value={products.length} hint="当前内容" />
        <MetricCard label="新闻内容" value={news.length} hint="当前内容" />
      </section>

      <section className="data-grid-two">
        <DataTable
          columns={["热门页面", "PV"]}
          rows={analytics.topPages.map((item) => ({ id: item.key, cells: [item.key, item.count] }))}
          empty="暂无访问数据，前台收到访问后自动展示。"
        />
        <DataTable
          columns={["主要来源", "访问量"]}
          rows={analytics.sources.map((item) => ({ id: item.key, cells: [item.key, item.count] }))}
          empty="暂无来源数据。"
        />
      </section>

      <section className="data-grid-two">
        <EmptyPanel title="热门产品" eyebrow="产品" />
        <EmptyPanel title="热门新闻" eyebrow="新闻" />
      </section>
    </>
  );
}
