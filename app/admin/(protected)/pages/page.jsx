import { DataTable, MetricCard, RangeBox } from "@/components/admin/DataPanels";
import { getPagePerformance } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function PagesPage() {
  const pages = await getPagePerformance();
  const pv = pages.reduce((sum, item) => sum + item.pv, 0);
  return (
    <>
      <header className="data-hero">
        <div>
          <small>页面表现</small>
          <h1>页面表现</h1>
          <p>查看页面浏览、访客、停留、跳出和转化表现。</p>
        </div>
        <RangeBox />
      </header>
      <section className="metric-grid">
        <MetricCard label="页面数" value={pages.length} hint="有访问页面" />
        <MetricCard label="页面浏览" value={pv} hint="PV" />
        <MetricCard label="平均停留" value="0s" hint="待更多事件" />
        <MetricCard label="跳出率" value="0%" hint="待更多事件" />
      </section>
      <DataTable
        columns={["页面", "PV", "UV", "平均停留", "跳出率", "转化"]}
        rows={pages.map((item) => ({ cells: [item.path, item.pv, item.uv, `${item.avgStay}s`, `${item.bounceRate}%`, `${item.conversion}%`] }))}
        empty="暂无页面表现数据。"
      />
    </>
  );
}
