import AdminListControls from "@/components/admin/AdminListControls";
import Pagination from "@/components/admin/Pagination";
import { getInquiries, paginateItems } from "@/lib/cmsStore";

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
            {result.items.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.name || "-"}</strong><br /><span className="admin-muted">{item.company || "-"}</span></td>
                <td>{item.email || "-"}<br /><span className="admin-muted">{item.phone || "-"}</span></td>
                <td>{item.product || "-"}</td>
                <td><span className="admin-badge">{statusText(item.status)}</span></td>
                <td>{item.message || "-"}</td>
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
            ))}
            {!result.items.length ? <tr><td colSpan="7">暂无询盘。</td></tr> : null}
          </tbody>
        </table>
      </div>
      <Pagination basePath="/admin/inquiries" page={result.page} pageSize={result.pageSize} total={result.total} query={params} />
    </>
  );
}

function statusText(value) {
  return statuses.find((item) => item.value === value)?.label || value || "-";
}
