import Link from "next/link";
import PasswordField from "@/components/admin/PasswordField";
import { getConfiguredAdminEmail, localAdminHint } from "@/lib/adminAccountStore";
import { isAdminAuthConfigured } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "后台登录 | Cowin Supply"
};

const errorMessages = {
  invalid: "邮箱或密码不正确。",
  "not-configured": "后台密码还没有配置，请先设置 ADMIN_PASSWORD 或 ADMIN_PASSWORD_HASH。",
  "rate-limited": "登录尝试过于频繁，请稍后再试。"
};

export default async function AdminLoginPage({ searchParams }) {
  const params = await searchParams;
  const configured = isAdminAuthConfigured();
  const hint = localAdminHint();
  const error = params?.error;

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <Link className="admin-login-brand" href="/">
          <span>CS</span>
          <strong>Cowin Supply</strong>
        </Link>
        <p className="eyebrow">Website Admin</p>
        <h1>后台登录</h1>
        <p className="admin-login-copy">登录后可以查看询盘、管理产品与新闻内容。</p>

        {!configured ? <div className="admin-alert">生产环境还没有配置后台密码。</div> : null}
        {hint ? <div className="admin-alert good">本地验收账号：{hint.email} / {hint.password}</div> : null}
        {error ? <div className="admin-alert">{errorMessages[error] || "登录失败。"}</div> : null}

        <form className="admin-login-form" action="/api/admin/login" method="post">
          <label>
            登录邮箱
            <input name="email" type="email" defaultValue={getConfiguredAdminEmail()} required />
          </label>
          <PasswordField />
          <label className="admin-check-row">
            <input name="remember" type="checkbox" defaultChecked />
            记住登录状态
          </label>
          <button type="submit" disabled={!configured}>登录后台</button>
          <p className="admin-muted">忘记密码请联系 Cowin Supply 管理员重置环境变量中的后台密码。</p>
        </form>
      </section>
    </main>
  );
}
