import Link from "next/link";
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
        <MetricCard label="本页最长路径" value={reliable && paths.length ? paths.reduce((max, item) => Math.max(max, item.pathCount), 0) : null} hint="当前页 · 访问步数" />
        <MetricCard label="最近会话入口页" value={reliable && paths.length ? paths[0].paths[0] : null} hint="当前页第一个会话" />
      </section>
      <AdminListControls action="/admin/paths" keyword={params?.q} pageSize={result.pageSize} range={range} />
      <DataTable
        columns={["会话", "访问路径", "查看"]}
        rows={reliable ? paths.map((item) => ({
          id: item.identity,
          cells: [item.sessionId.slice(0, 10), item.paths.join(" → ") + (item.pathCount > item.paths.length ? ` …（共 ${item.pathCount} 步）` : ""), <Link key={item.identity} className="lead-detail-button" href={`/admin/visitors/${encodeURIComponent(item.identity)}`}>路径详情</Link>]
        })) : []}
        empty={reliable ? "暂无访问路径数据。" : "生产环境未配置持久化数据库，无法提供可靠的访问路径。"}
      />
      {reliable ? <Pagination basePath="/admin/paths" page={result.page} pageSize={result.pageSize} total={result.total} query={params} /> : null}
      <p className="admin-data-footnote">{hasPersistentStore() ? "会话统计覆盖所选日期内的全部已记录事件。列表预览前 12 步，详情可分页查看完整记录。" : "本地模式使用保留的最近 5,000 条事件。"}</p>
    </>
  );
}
