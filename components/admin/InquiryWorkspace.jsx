"use client";

import { useState } from "react";

const statusOptions = [
  { value: "new", label: "新线索" },
  { value: "contacted", label: "已联系" },
  { value: "quoted", label: "报价中" },
  { value: "closed", label: "已成交" },
  { value: "invalid", label: "无效线索" },
  { value: "archived", label: "已归档" }
];

export default function InquiryWorkspace({ items = [] }) {
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function openInquiry(id) {
    setSelectedId(id);
    setDetail(null);
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/inquiries/${encodeURIComponent(id)}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "无法读取线索详情");
      setDetail(result.data);
    } catch (requestError) {
      setError(requestError.message || "无法读取线索详情");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(nextStatus) {
    if (!selectedId || !detail) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/inquiries/${encodeURIComponent(selectedId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "状态未保存");
      setDetail((current) => ({ ...current, inquiry: { ...current.inquiry, status: nextStatus, updatedAt: result.data.updatedAt } }));
    } catch (requestError) {
      setError(requestError.message || "状态未保存");
    } finally {
      setSaving(false);
    }
  }

  return <>
    <div className="lead-workspace" aria-label="客户线索列表">
      <div className="lead-workspace-head">
        <p>点击任意线索可在右侧展开完整信息、邮件投递记录与浏览路径。</p>
        <span>{items.length} 条当前结果</span>
      </div>
      <div className="lead-table-scroll">
        <table className="admin-table lead-table">
          <thead><tr><th>客户</th><th>联系方式</th><th>需求</th><th>来源</th><th>状态</th><th>提交时间</th><th><span className="sr-only">查看详情</span></th></tr></thead>
          <tbody>
            {items.map((item) => <tr className={selectedId === item.id ? "is-selected" : ""} key={item.id} onClick={(event) => {
              if (event.target.closest("a, button, select, input, label")) return;
              openInquiry(item.id);
            }}>
              <td><button type="button" className="lead-open-button" onClick={() => openInquiry(item.id)}><strong>{item.name || "未留姓名"}</strong><span>{item.company || "未填写公司"}</span></button></td>
              <td><a href={`mailto:${item.email}`}>{item.email || "未留邮箱"}</a><span className="admin-muted">{item.phone || "未留电话"}</span></td>
              <td><strong>{item.product || "一般咨询"}</strong><span className="lead-clamp">{item.message || "客户未填写留言"}</span></td>
              <td><span>{item.utmSource || item.referrer || "直接访问"}</span><span className="admin-muted">{item.visitorId || item.sessionId ? "已关联路径" : "历史记录"}</span></td>
              <td><span className={`lead-status status-${item.status || "new"}`}>{labelForStatus(item.status)}</span></td>
              <td><time>{formatTime(item.createdAt)}</time></td>
              <td><button type="button" className="lead-detail-button" onClick={() => openInquiry(item.id)}>详情</button></td>
            </tr>)}
            {!items.length ? <tr><td colSpan="7" className="lead-empty">当前筛选条件下没有客户线索。</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>

    {selectedId ? <aside className="lead-drawer" aria-modal="true" aria-label="客户线索详情" role="dialog">
      <div className="lead-drawer-bar">
        <div><small>客户线索详情</small><strong>{detail?.inquiry?.name || (loading ? "正在加载" : "线索")}</strong></div>
        <button type="button" className="lead-close" onClick={() => { setSelectedId(""); setDetail(null); setError(""); }} aria-label="关闭详情">×</button>
      </div>
      {loading ? <DrawerLoading /> : null}
      {error ? <div className="lead-error"><strong>无法加载详情</strong><p>{error}</p><button type="button" onClick={() => openInquiry(selectedId)}>重新尝试</button></div> : null}
      {detail ? <InquiryDetail detail={detail} saving={saving} onStatusChange={updateStatus} /> : null}
    </aside> : null}
    {selectedId ? <button type="button" className="lead-backdrop" aria-label="关闭客户详情" onClick={() => { setSelectedId(""); setDetail(null); }} /> : null}
  </>;
}

function InquiryDetail({ detail, saving, onStatusChange }) {
  const { inquiry, journey = [], summary = {}, activities = [], notifications = [] } = detail;
  const sourceRows = [
    ["提交页面", inquiry.pageUrl], ["首次落地页", inquiry.landingPage], ["来源", inquiry.referrer],
    ["UTM", [inquiry.utmSource, inquiry.utmMedium, inquiry.utmCampaign, inquiry.utmTerm, inquiry.utmContent].filter(Boolean).join(" / ")],
    ["访问地区", inquiry.visitorCountry], ["浏览器语言", inquiry.browserLanguage], ["访客时区", inquiry.timezone], ["屏幕尺寸", inquiry.screen]
  ];
  const demandRows = [
    ["公司", inquiry.company], ["邮箱", inquiry.email], ["电话 / WhatsApp", inquiry.phone], ["国家 / 地区", inquiry.country],
    ["买家类型", inquiry.buyerType], ["预计采购量", inquiry.estimatedQuantity], ["产品", inquiry.product], ["型号", inquiry.productModel], ["所需电压 / 规格", inquiry.requiredSpecification]
  ];

  return <div className="lead-drawer-content">
    <section className="lead-summary">
      <div><small>提交时间</small><strong>{formatTime(inquiry.createdAt)}</strong></div>
      <div><small>浏览记录</small><strong>{summary.pageViews || 0} 次 / {summary.uniquePages || 0} 页</strong></div>
      <div><small>最后活动</small><strong>{summary.lastSeenAt ? formatTime(summary.lastSeenAt) : "未记录"}</strong></div>
    </section>
    <section className="lead-section lead-actions-section">
      <div className="lead-section-title"><small>线索状态</small><h2>{labelForStatus(inquiry.status)}</h2></div>
      <select value={inquiry.status || "new"} onChange={(event) => onStatusChange(event.target.value)} disabled={saving} aria-label="更新线索状态">
        {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <div className="lead-contact-actions">
        {inquiry.email ? <a href={`mailto:${inquiry.email}`}>发送邮件</a> : null}
        {inquiry.phone ? <a href={`https://wa.me/${String(inquiry.phone).replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a> : null}
        <a href={`/admin/inquiries/${inquiry.id}`}>完整页面</a>
      </div>
    </section>
    <DataSection title="客户与采购需求" rows={demandRows} />
    <section className="lead-section"><div className="lead-section-title"><small>客户留言</small><h2>原始询盘内容</h2></div><p className="lead-message">{inquiry.message || "客户未填写留言。"}</p></section>
    <DataSection title="来源与访问上下文" rows={sourceRows} />
    <Timeline title="浏览路径" empty="此历史询盘没有可靠的访客关联记录。" items={journey} render={(event) => <><strong>{event.path}</strong><span>{event.title || "未记录页面标题"}</span><small>{event.source || "直接访问"} · {event.device || "未知设备"} · {event.country || "未知地区"}</small></>} />
    <Timeline title="系统与跟进记录" empty="暂时没有后续操作记录。" items={[...notifications, ...activities].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))} render={(event) => <><strong>{activityLabel(event)}</strong><span>{event.summary || event.reason || "系统已处理该记录"}</span><small>{event.actor || event.provider || "系统"}</small></>} />
  </div>;
}

function DataSection({ title, rows }) {
  return <section className="lead-section"><div className="lead-section-title"><small>详细资料</small><h2>{title}</h2></div><dl className="lead-fields">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ? asLink(value) : "未填写"}</dd></div>)}</dl></section>;
}

function Timeline({ title, empty, items, render }) {
  return <section className="lead-section"><div className="lead-section-title"><small>活动时间线</small><h2>{title}</h2></div>{items.length ? <ol className="lead-timeline">{items.map((item) => <li key={item.id}><time>{formatTime(item.createdAt)}</time><div>{render(item)}</div></li>)}</ol> : <p className="lead-empty">{empty}</p>}</section>;
}

function DrawerLoading() { return <div className="lead-drawer-loading"><span /><span /><span /></div>; }
function labelForStatus(value) { return statusOptions.find((item) => item.value === value)?.label || "新线索"; }
function activityLabel(event) { return ({ received: "官网表单已收到", notification_sent: "邮件通知已发送", notification_failed: "邮件通知发送失败", status_changed: "线索状态已更新" })[event.type] || "系统记录"; }
function formatTime(value) { return value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "-"; }
function asLink(value) { const text = String(value); return /^https?:\/\//.test(text) ? <a href={text} target="_blank" rel="noreferrer">{text}</a> : text; }
