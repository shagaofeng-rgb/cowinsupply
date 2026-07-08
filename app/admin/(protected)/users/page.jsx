import { getConfiguredAdminEmail, isAdminPasswordConfigured } from "@/lib/adminAccountStore";

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  const email = getConfiguredAdminEmail();
  const configured = isAdminPasswordConfigured();

  return (
    <>
      <header className="admin-page-head">
        <div>
          <h1>账号权限</h1>
          <p>查看 Cowin Supply 后台当前管理员账号和权限配置。</p>
        </div>
      </header>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>账号</th>
              <th>角色</th>
              <th>权限范围</th>
              <th>密码状态</th>
              <th>配置方式</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>{email}</strong></td>
              <td><span className="admin-badge">超级管理员</span></td>
              <td>产品、新闻、分类、询盘、SEO、设置、日志</td>
              <td>{configured ? "已配置" : "未配置"}</td>
              <td>环境变量</td>
            </tr>
          </tbody>
        </table>
      </div>

      <section className="admin-section admin-card">
        <h2>安全说明</h2>
        <p className="admin-muted">后台密码由 Vercel 环境变量管理，不在页面展示。需要新增多账号、角色权限和登录限流时，应接入持久数据库后再开放账号管理写入。</p>
      </section>
    </>
  );
}
