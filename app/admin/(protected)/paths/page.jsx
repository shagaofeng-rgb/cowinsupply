import { DataTable, MetricCard } from "@/components/admin/DataPanels";
import Pagination from "@/components/admin/Pagination";
import AdminListControls from "@/components/admin/AdminListControls";
import RangeBox from "@/components/admin/RangeBox";
import { getAdminDateRange } from "@/lib/adminDateRange";
import { getVisitPaths } from "@/lib/cmsStore";
import { hasPersistentStore } from "@/lib/persistentStore";

export const dynamic = "force-dynamic";

export default async function PathsPage({ searchParams }) {
  const params = await searchParams;
  const range = getAdminDateRange(params);
  const reliable = hasPersistentStore() || !process.env.VERCEL;
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
        <MetricCard label="会话数" value={reliable ? result.total : null} hint="当前筛选结果" />
        <MetricCard label="本页最长路径" value={reliable && paths.length ? paths.reduce((max, item) => Math.max(max, item.paths.length), 0) : null} hint="当前页 · 页面数" />
        <MetricCard label="最近会话入口页" value={reliable && paths.length ? paths[0].paths[0] : null} hint="当前页第一个会话" />
      </section>
      <AdminListControls action="/admin/paths" keyword={params?.q} pageSize={result.pageSize} range={range} />
      <DataTable
        columns={["会话", "访问路径"]}
        rows={reliable ? paths.map((item) => ({ cells: [item.sessionId.slice(0, 10), item.paths.join(" → ")] })) : []}
        empty={reliable ? "暂无访问路径数据。" : "生产环境未配置持久化数据库，无法提供可靠的访问路径。"}
      />
      {reliable ? <Pagination basePath="/admin/paths" page={result.page} pageSize={result.pageSize} total={result.total} query={params} /> : null}
      <p className="admin-data-footnote">访问路径由实际事件按会话标识整理。数据库模式目前使用最近 5,000 条事件，较早路径可能不在当前列表中。</p>
    </>
  );
}
