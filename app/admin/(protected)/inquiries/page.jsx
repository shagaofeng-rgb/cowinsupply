import AdminListControls from "@/components/admin/AdminListControls";
import Pagination from "@/components/admin/Pagination";
import { Fragment } from "react";
import { getInquiries, getInquiryDetails, paginateItems } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

const statuses = [
  { value: "new", label: "新询盘" },
  { value: "contacted", label: "已联系" },
  { value: "quoted", label: "报价中" },
  { value: "closed", label: "已成交" },
  { value: "invalid", label: "无效线索" },
  { value: "archived", label: "已归档" }
];

export default async function AdminInquiriesPage({ searchParams }) {
  const params = await searchParams;
  const allInquiries = await getInquiries();
  const result = paginateItems(allInquiries, params);
  const detailById = await getInquiryDetails(result.items.map((item) => item.id));

  return (
    <>
      <header className="admin-page-head">
        <div>
          <h1>询盘记录</h1>
          <p>查看 Cowin Supply 官网当前收到的客户询盘，支持筛选、状态更新和 CSV 导出。</p>
        </div>
        <a className="admin-button" href="/api/admin/inquiries/export">导出 CSV</a>
      </header>

      <AdminListControls action="/admin/inquiries" keyword={params?.q} status={params?.status} pageSize={result.pageSize} statusOptions={statuses} />

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>客户</th>
              <th>联系方式</th>
              <th>产品</th>
              <th>状态</th>
              <th>留言</th>
              <th>时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((item) => {
              const detail = detailById.get(item.id);
              return <Fragment key={item.id}>
              <tr>
                <td><strong>{item.name || "-"}</strong><br /><span className="admin-muted">{item.company || "-"}</span></td>
                <td>{item.email || "-"}<br /><span className="admin-muted">{item.phone || "-"}</span></td>
                <td>{item.product || "-"}</td>
                <td><span className="admin-badge">{statusText(item.status)}</span></td>
                <td><span className="admin-muted">{item.utmSource || item.referrer || "Direct"}</span><br /><span className="admin-muted">{item.visitorId ? "Path linked" : "Legacy record"}</span></td>
                <td>{new Date(item.createdAt).toLocaleString("zh-CN")}</td>
                <td>
                  <form className="admin-inline-form" action="/api/admin/inquiries/status" method="post">
                    <input name="id" type="hidden" value={item.id} />
                    <select name="status" defaultValue={item.status}>
                      {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                    </select>
                    <button type="submit">保存</button>
                  </form>
                </td>
              </tr>
              <tr className="inquiry-expand-row"><td colSpan="7"><details className="inquiry-inline-details"><summary>点击展开客户完整资料和浏览路径</summary><InquiryInlineDetail detail={detail} /></details></td></tr>
              </Fragment>;
            })}
            {!result.items.length ? <tr><td colSpan="7">暂无询盘。</td></tr> : null}
          </tbody>
        </table>
      </div>
      <Pagination basePath="/admin/inquiries" page={result.page} pageSize={result.pageSize} total={result.total} query={params} />
    </>
  );
}

function InquiryInlineDetail({ detail }) {
  if (!detail) return <div className="empty-line">未找到该询盘的详细记录。</div>;
  const { inquiry, journey, summary, journeyAvailable } = detail;
  const context = [["提交页面", inquiry.pageUrl], ["首次落地页", inquiry.landingPage], ["来源", inquiry.referrer], ["UTM", [inquiry.utmSource, inquiry.utmMedium, inquiry.utmCampaign, inquiry.utmTerm, inquiry.utmContent].filter(Boolean).join(" / ")], ["访问地区", inquiry.visitorCountry], ["浏览器语言", inquiry.browserLanguage], ["访客时区", inquiry.timezone], ["屏幕尺寸", inquiry.screen]];
  const purchase = [["买家类型", inquiry.buyerType], ["预计采购量", inquiry.estimatedQuantity], ["产品", inquiry.product], ["型号", inquiry.productModel], ["所需电压 / 规格", inquiry.requiredSpecification]];
  return <div className="inquiry-inline-content"><div className="inquiry-inline-grid"><InlineBlock title="采购需求" rows={purchase} /><InlineBlock title="来源与访问上下文" rows={context} /></div><div className="inquiry-inline-message"><strong>客户留言</strong><p>{inquiry.message || "客户未填写留言。"}</p></div><div className="inquiry-journey"><strong>浏览路径</strong><span className="admin-muted">{summary.pageViews} 次访问 / {summary.uniquePages} 个页面</span>{!journeyAvailable ? <p className="admin-muted">历史询盘没有保存访客 ID，无法安全关联浏览路径。</p> : null}{journeyAvailable && !journey.length ? <p className="admin-muted">已保存访客 ID，但当前没有匹配的访问事件。</p> : null}{journey.length ? <ol>{journey.map((event) => <li key={event.id}><time>{new Date(event.createdAt).toLocaleString("zh-CN")}</time><span>{event.path} · {event.source || "Direct"} · {event.device || "Unknown device"}</span></li>)}</ol> : null}</div></div>;
}

function InlineBlock({ title, rows }) { return <section><strong>{title}</strong><dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{asLink(value)}</dd></div>)}</dl></section>; }
function asLink(value) { const text = String(value || "-"); return /^https?:\/\//.test(text) ? <a href={text} target="_blank" rel="noreferrer">{text}</a> : text; }

function statusText(value) {
  return statuses.find((item) => item.value === value)?.label || value || "-";
}
