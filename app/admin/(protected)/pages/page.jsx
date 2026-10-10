import { DataTable, MetricCard } from "@/components/admin/DataPanels";
import AdminListControls from "@/components/admin/AdminListControls";
import Pagination from "@/components/admin/Pagination";
import RangeBox from "@/components/admin/RangeBox";
import { getAdminDateRange } from "@/lib/adminDateRange";
import { getPagePerformance, paginateItems } from "@/lib/cmsStore";
import { hasPersistentStore } from "@/lib/persistentStore";

export const dynamic = "force-dynamic";

export default async function PagesPage({ searchParams }) {
  const params = await searchParams;
  const range = getAdminDateRange(params);
  const reliable = hasPersistentStore() || !process.env.VERCEL;
  const pages = await getPagePerformance(range);
  const result = paginateItems(pages, { ...params, from: "", to: "" });
  const pv = pages.reduce((sum, item) => sum + item.pv, 0);
  return (
    <>
      <header className="data-hero">
        <div>
          <small>页面表现</small>
          <h1>页面表现</h1>
          <p>查看所选时间内各页面的浏览次数与按访客标识去重的人数。</p>
        </div>
        <RangeBox />
      </header>
      <section className="metric-grid">
        <MetricCard label="有访问页面" value={reliable ? pages.length : null} hint="所选时间范围" />
        <MetricCard label="页面浏览" value={reliable ? pv : null} hint="所选时间范围 · PV" />
      </section>
      <AdminListControls action="/admin/pages" keyword={params?.q} pageSize={result.pageSize} range={range} />
      <DataTable
        title="页面明细"
        columns={["页面", "PV", "UV"]}
        rows={reliable ? result.items.map((item) => ({ cells: [item.path, item.pv, item.uv] })) : []}
        empty={reliable ? "暂无页面表现数据。" : "生产环境未配置持久化数据库，无法提供可靠的页面数据。"}
      />
      {reliable ? <Pagination basePath="/admin/pages" page={result.page} pageSize={result.pageSize} total={result.total} query={params} /> : null}
      <p className="admin-data-footnote">来源：站内访问事件。停留时间、跳出率和页面转化尚无可靠计算依据，因此不展示。</p>
    </>
  );
}
