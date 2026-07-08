import { getSystemStatus } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function AdminSystemPage() {
  const status = await getSystemStatus();

  return (
    <>
      <header className="admin-page-head">
        <div>
          <h1>系统状态</h1>
          <p>检查 Cowin Supply 当前部署、邮件、数据层和内容数量。</p>
        </div>
      </header>

      <div className="admin-grid">
        <Stat label="产品" value={status.counts.products} />
        <Stat label="新闻" value={status.counts.news} />
        <Stat label="询盘" value={status.counts.inquiries} />
        <Stat label="素材" value={status.counts.media} />
      </div>

      <section className="admin-section admin-two-col">
        <div className="admin-card">
          <h2>部署状态</h2>
          <div className="admin-status-list">
            <Row label="运行环境" value={status.nodeEnv} />
            <Row label="Vercel 部署" value={status.isVercel ? "是" : "否"} />
            <Row label="部署地址" value={status.deploymentUrl || "本地环境"} />
            <Row label="检查时间" value={new Date(status.checkedAt).toLocaleString("zh-CN")} />
          </div>
        </div>
        <div className="admin-card">
          <h2>服务状态</h2>
          <div className="admin-status-list">
            <Row label="官网域名" value={status.siteUrl} />
            <Row label="SMTP 邮件" value={status.smtpConfigured ? "已配置" : "未配置"} />
            <Row label="数据层" value={status.dataStore} />
            <Row label="操作日志" value={`${status.counts.auditLogs} 条`} />
          </div>
          <p className="admin-muted">当前数据层可支撑后台功能演示和轻量运营；正式长期运营建议接入 PostgreSQL 持久数据库。</p>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }) {
  return (
    <section className="admin-card">
      <small>{label}</small>
      <strong>{value}</strong>
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div className="admin-status-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
