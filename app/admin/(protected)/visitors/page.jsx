import Link from "next/link";
import { DataTable, MetricCard } from "@/components/admin/DataPanels";
import AdminListControls from "@/components/admin/AdminListControls";
import Pagination from "@/components/admin/Pagination";
import RangeBox from "@/components/admin/RangeBox";
import { getAdminDateRange } from "@/lib/adminDateRange";
import { getAnalyticsReport, getCustomerDirectory } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function VisitorsPage({ searchParams }) {
  const params = await searchParams;
  const range = getAdminDateRange(params);
  const [analytics, customers] = await Promise.all([getAnalyticsReport(range), getCustomerDirectory({ ...params, ...range })]);
  return (
    <>
      <header className="data-hero">
        <div>
          <small>访客记录</small>
          <h1>访客记录</h1>
          <p>按客户或稳定访客标识聚合浏览记录，可进入详情查看同一客户的完整访问路径。</p>
        </div>
        <RangeBox />
      </header>
      <section className="metric-grid">
        <MetricCard label="访问事件" value={analytics.pv} hint="PV" />
        <MetricCard label="独立访客" value={analytics.uv} hint="UV" />
        <MetricCard label="来源类型" value={analytics.sources.length} hint="渠道" />
        <MetricCard label="设备类型" value={analytics.devices.length} hint="设备" />
      </section>
      <AdminListControls action="/admin/visitors" keyword={params?.q} pageSize={customers.pageSize} range={range} />
      <DataTable
        columns={["客户 / 访客", "公司与地区", "访问", "询盘", "首次 / 最近活动", "查看"]}
        rows={customers.items.map((item) => ({
          id: item.identity,
          cells: [item.name, [item.company || "未留公司", item.country || "未知地区"].join(" · "), `${item.pageViews} 次 / ${item.uniquePages} 页`, item.inquiryCount, `${formatTime(item.firstSeenAt)} / ${formatTime(item.lastSeenAt)}`, <Link key={`detail-${item.identity}`} className="lead-detail-button" href={`/admin/visitors/${encodeURIComponent(item.identity)}`}>访问详情</Link>]
        }))}
        empty="当前时间范围内没有访客记录。"
      />
      <Pagination basePath="/admin/visitors" page={customers.page} pageSize={customers.pageSize} total={customers.total} query={params} />
    </>
  );
}

function formatTime(value) { return value ? new Date(value).toLocaleString("zh-CN", { hour12: false, timeZone: "Asia/Shanghai" }) : "-"; }
