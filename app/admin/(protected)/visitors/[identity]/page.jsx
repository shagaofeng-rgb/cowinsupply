import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerDetail } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function VisitorDetailPage({ params }) {
  const { identity } = await params;
  const detail = await getCustomerDetail(decodeURIComponent(identity));
  if (!detail) notFound();
  const { customer, inquiries, journey } = detail;

  return <>
    <header className="admin-page-head lead-page-head">
      <div>
        <small>客户访问详情</small>
        <h1>{customer.name}</h1>
        <p>{customer.company || "匿名访客"} · {customer.country || "地区未识别"}</p>
      </div>
      <Link className="admin-button" href="/admin/visitors">返回访客目录</Link>
    </header>

    <section className="metric-grid">
      <Metric label="累计访问" value={`${customer.pageViews} 次`} hint={`${customer.uniquePages} 个页面`} />
      <Metric label="关联询盘" value={customer.inquiryCount} hint="真实表单记录" />
      <Metric label="首次访问" value={formatTime(customer.firstSeenAt)} hint="上海时间" />
      <Metric label="最近访问" value={formatTime(customer.lastSeenAt)} hint="上海时间" />
    </section>

    <section className="data-panel visitor-detail-panel">
      <small>访问路径</small><h2>同一客户的完整浏览记录</h2>
      {journey.length ? <ol className="journey-timeline">{journey.map((event) => <li key={event.id}><time>{formatTime(event.createdAt)}</time><div><strong>{event.path}</strong><p>{event.title || "未记录页面标题"}</p><span>{event.source || "直接访问"} · {event.device || "未知设备"} · {event.country || "未知地区"}</span>{event.referrer ? <small>来源页：{event.referrer}</small> : null}</div></li>)}</ol> : <div className="empty-line">尚未找到与该访客标识关联的浏览事件。</div>}
    </section>

    <section className="data-panel visitor-detail-panel">
      <small>关联表单</small><h2>该客户的全部询盘</h2>
      {inquiries.length ? <div className="data-table-wrap"><table className="admin-table"><thead><tr><th>时间</th><th>产品 / 需求</th><th>状态</th><th>查看</th></tr></thead><tbody>{inquiries.map((item) => <tr key={item.id}><td>{formatTime(item.createdAt)}</td><td><strong>{item.product || "一般咨询"}</strong><br /><span className="admin-muted">{item.message || "未填写留言"}</span></td><td>{item.status || "new"}</td><td><Link href={`/admin/inquiries/${item.id}`}>询盘详情</Link></td></tr>)}</tbody></table></div> : <div className="empty-line">该访客尚未提交可关联的表单。</div>}
    </section>
  </>;
}

function Metric({ label, value, hint }) { return <section className="metric-card"><i /><span>{label}</span><strong>{value}</strong><small>{hint}</small></section>; }
function formatTime(value) { return value ? new Date(value).toLocaleString("zh-CN", { hour12: false, timeZone: "Asia/Shanghai" }) : "-"; }
