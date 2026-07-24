import { getSiteSettings } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <header className="admin-page-head">
        <div>
          <h1>站点设置</h1>
          <p>维护 Cowin Supply 当前官网基础信息和邮件通知状态。</p>
        </div>
      </header>

      <section className="admin-two-col">
        <form className="admin-form admin-card" action="/api/admin/settings" method="post">
          <h2>基础信息</h2>
          <label>站点名称<input name="siteName" defaultValue={settings.siteName} /></label>
          <label>官网域名<input name="siteUrl" defaultValue={settings.siteUrl} /></label>
          <label>公司邮箱<input name="companyEmail" defaultValue={settings.companyEmail} /></label>
          <label>Company phone<input name="companyPhone" defaultValue={settings.companyPhone} /></label>
          <label>默认语言<input name="defaultLanguage" defaultValue={settings.defaultLanguage} /></label>
          <label>SEO 标题<input name="seoTitle" defaultValue={settings.seoTitle} /></label>
          <label>SEO 描述<textarea name="seoDescription" defaultValue={settings.seoDescription} /></label>
          <button type="submit">保存设置</button>
        </form>

        <div className="admin-card">
          <h2>邮件通知</h2>
          <div className="admin-status-list">
            <StatusRow label="SMTP 状态" value={settings.smtpConfigured ? "已配置" : "未配置"} good={settings.smtpConfigured} />
            <StatusRow label="接收邮箱" value={settings.adminNotificationEmail} good />
            <StatusRow label="发件账号" value={process.env.SMTP_USER ? maskEmail(process.env.SMTP_USER) : "未配置"} good={Boolean(process.env.SMTP_USER)} />
          </div>
          <p className="admin-muted">出于安全原因，SMTP 密码不会在后台展示。</p>
        </div>
      </section>
    </>
  );
}

function StatusRow({ label, value, good }) {
  return (
    <div className="admin-status-row">
      <span>{label}</span>
      <strong className={good ? "is-good" : "is-warn"}>{value}</strong>
    </div>
  );
}

function maskEmail(value) {
  const [name, domain] = String(value).split("@");
  if (!domain) return "已配置";
  return `${name.slice(0, 2)}***@${domain}`;
}
