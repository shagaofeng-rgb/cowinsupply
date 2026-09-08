import { DataTable, MetricCard } from "@/components/admin/DataPanels";
import Pagination from "@/components/admin/Pagination";
import AdminListControls from "@/components/admin/AdminListControls";
import RangeBox from "@/components/admin/RangeBox";
import { getAdminDateRange } from "@/lib/adminDateRange";
import { getVisitPaths } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function PathsPage({ searchParams }) {
  const params = await searchParams;
  const range = getAdminDateRange(params);
  const result = await getVisitPaths({ ...params, ...range });
  const paths = result.items;
  return (
    <>
      <header className="data-hero">
        <div>
          <small>访问路径</small>
          <h1>访问路径</h1>
          <p>按会话查看用户访问路径，分析进入页、浏览顺序和离开路径。</p>
        </div>
        <RangeBox />
      </header>
      <section className="metric-grid">
        <MetricCard label="会话数" value={result.total} hint="访问路径" />
        <MetricCard label="最长路径" value={paths.reduce((max, item) => Math.max(max, item.paths.length), 0)} hint="页面数" />
        <MetricCard label="入口页" value={paths.length ? paths[0].paths[0] : 0} hint="最近路径" />
        <MetricCard label="路径完整度" value={paths.length ? "已采集" : "等待数据"} hint="事件链路" />
      </section>
      <AdminListControls action="/admin/paths" keyword={params?.q} pageSize={result.pageSize} range={range} />
      <DataTable
        columns={["会话", "访问路径"]}
        rows={paths.map((item) => ({ cells: [item.sessionId.slice(0, 10), item.paths.join(" → ")] }))}
        empty="暂无访问路径数据。"
      />
      <Pagination basePath="/admin/paths" page={result.page} pageSize={result.pageSize} total={result.total} query={params} />
    </>
  );
}
