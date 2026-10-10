import Link from "next/link";
import { notFound } from "next/navigation";
import { getInquiryDetail } from "@/lib/cmsStore";

const statuses = [["new", "新询盘"], ["contacted", "已联系"], ["quoted", "已报价"], ["closed", "已关闭"], ["invalid", "无效"], ["archived", "已归档"]];

export const dynamic = "force-dynamic";

export default async function InquiryDetailPage({ params }) {
  const { id } = await params;
  const detail = await getInquiryDetail(id);
  if (!detail) notFound();
  const { inquiry, journey, summary, journeyAvailable, customer = {}, relatedInquiries = [] } = detail;

  return <>
    <header className="admin-page-head inquiry-detail-head">
      <div><Link className="admin-back-link" href="/admin/inquiries">返回询盘列表</Link><h1>{inquiry.name || "未填写姓名"}</h1><p>{inquiry.company || "未填写公司"} · 提交于 {formatTime(inquiry.createdAt)}</p></div>
      <form className="admin-inline-form" action="/api/admin/inquiries/status" method="post"><input name="id" type="hidden" value={inquiry.id} /><select name="status" defaultValue={inquiry.status}>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="submit">保存状态</button></form>
    </header>
    <section className="inquiry-summary-grid"><Summary label="提交时间" value={formatTime(inquiry.createdAt)} /><Summary label="已记录浏览" value={`${summary.pageViews} 次 / ${summary.uniquePages} 页`} /><Summary label="首次记录" value={summary.firstSeenAt ? formatTime(summary.firstSeenAt) : "暂无访问记录"} /><Summary label="最近记录" value={summary.lastSeenAt ? formatTime(summary.lastSeenAt) : "暂无访问记录"} /></section>
    <section className="admin-card inquiry-customer-card"><small>客户资料</small><h2>可关联的客户记录</h2><dl className="inquiry-customer-facts"><div><dt>客户标识</dt><dd>{customer.identity || "未识别"}</dd></div><div><dt>关联询盘</dt><dd>{relatedInquiries.length || 1}</dd></div><div><dt>已记录访问</dt><dd>{customer.totalVisits || summary.totalVisits || journey.length || 0}</dd></div><div><dt>访问页面</dt><dd>{customer.uniquePaths || summary.uniquePaths || 0}</dd></div></dl></section>
    <section className="admin-two-col inquiry-detail-grid">
      <DetailSection title="联系方式与需求" rows={[["姓名", inquiry.name], ["公司", inquiry.company], ["邮箱", inquiry.email], ["电话 / WhatsApp", inquiry.phone], ["国家 / 地区", inquiry.country], ["采购类型", inquiry.buyerType], ["预计数量", inquiry.estimatedQuantity], ["产品", inquiry.product], ["型号", inquiry.productModel], ["电压 / 规格要求", inquiry.requiredSpecification]]} />
      <DetailSection title="来源与访问环境" rows={[["提交页面", inquiry.pageUrl], ["落地页", inquiry.landingPage], ["来源页", inquiry.referrer], ["UTM 来源", inquiry.utmSource], ["UTM 媒介", inquiry.utmMedium], ["UTM 活动", inquiry.utmCampaign], ["UTM 关键词", inquiry.utmTerm], ["UTM 内容", inquiry.utmContent], ["访客地区", inquiry.visitorCountry], ["浏览器语言", inquiry.browserLanguage], ["访客时区", inquiry.timezone], ["屏幕", inquiry.screen]]} />
    </section>
    <section className="admin-card inquiry-message-card"><h2>客户留言</h2><p>{inquiry.message || "未填写留言。"}</p></section>
    <section className="admin-card journey-card"><small>访问路径</small><h2>该客户已保留的浏览记录</h2><p className="admin-muted">仅依据邮箱、电话、访客标识或会话标识关联，不推断未记录的浏览历史。</p>{!journeyAvailable ? <div className="empty-line">该询盘缺少访客标识，无法可靠关联访问路径。</div> : null}{journeyAvailable && !journey.length ? <div className="empty-line">暂无匹配的页面浏览事件。</div> : null}{journey.length ? <ol className="journey-timeline">{journey.map((event) => <li key={event.id}><time>{formatTime(event.createdAt)}</time><div><strong>{event.path}</strong><p>{event.title || "未记录页面标题"}</p><span>{event.source || "直接访问"} · {event.device || "未知设备"} · {event.country || "未知地区"}</span>{event.referrer ? <small>来源页：{event.referrer}</small> : null}</div></li>)}</ol> : null}</section>
    <section className="admin-card inquiry-related-card"><small>关联询盘</small><h2>该客户可关联的表单记录</h2>{relatedInquiries.length ? <ol className="inquiry-related-list">{relatedInquiries.map((item) => <li key={item.id}><time>{formatTime(item.createdAt)}</time><div><strong>{item.product || "一般咨询"}</strong><p>{item.message || "未填写留言。"}</p><span>{statuses.find(([value]) => value === item.status)?.[1] || "未设置"}</span></div></li>)}</ol> : <div className="empty-line">暂无可关联的表单记录。</div>}</section>
  </>;
}

function DetailSection({ title, rows }) { return <section className="admin-card inquiry-fields"><h2>{title}</h2><dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{linkValue(value)}</dd></div>)}</dl></section>; }
function Summary({ label, value }) { return <section className="admin-card inquiry-summary"><small>{label}</small><strong>{value}</strong></section>; }
function formatTime(value) { return value ? new Date(value).toLocaleString("zh-CN", { hour12: false, timeZone: "Asia/Shanghai" }) : "-"; }
function linkValue(value) { const text = String(value || "-"); return /^https?:\/\//.test(text) ? <a href={text} target="_blank" rel="noreferrer">{text}</a> : text; }
