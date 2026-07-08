import Pagination from "@/components/admin/Pagination";
import { getAuditLogs, paginateItems } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage({ searchParams }) {
  const params = await searchParams;
  const logs = await getAuditLogs();
  const result = paginateItems(logs, params);

  return (
    <>
      <header className="admin-page-head">
        <div>
          <h1>操作日志</h1>
          <p>记录 Cowin Supply 后台的登录、内容管理、询盘处理和导出操作。</p>
        </div>
      </header>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>账号</th>
              <th>模块</th>
              <th>动作</th>
              <th>对象</th>
              <th>结果</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((item) => (
              <tr key={item.id}>
                <td>{new Date(item.createdAt).toLocaleString("zh-CN")}</td>
                <td>{item.actor}</td>
                <td>{item.module}</td>
                <td>{item.action}</td>
                <td>{item.target || "-"}</td>
                <td><span className="admin-badge">{item.result}</span></td>
              </tr>
            ))}
            {!result.items.length ? <tr><td colSpan="6">暂无操作日志。</td></tr> : null}
          </tbody>
        </table>
      </div>
      <Pagination basePath="/admin/audit" page={result.page} pageSize={result.pageSize} total={result.total} query={params} />
    </>
  );
}
