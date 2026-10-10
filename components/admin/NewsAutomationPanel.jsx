export default function NewsAutomationPanel({ dashboard }) {
  const metrics = dashboard.metrics || {};
  const runs = dashboard.runs || [];

  return <section className="admin-card news-automation-panel">
    <div className="news-automation-heading">
      <div><h2>自动新闻历史记录</h2><p>自动抓取、撰写与发布程序已停用。这里仅保留既有结果和运行记录供核对；人工新闻管理与 Blog 插件发布不受影响。</p></div>
      <span className="status-muted">已停用</span>
    </div>
    <div className="admin-kpis">
      <div><strong>{metrics.publishedByV2 ?? 0}</strong><span>历史自动发布</span></div>
      <div><strong>{metrics.needsReview ?? 0}</strong><span>历史待复核候选</span></div>
      <div><strong>{metrics.duplicateBlocked ?? 0}</strong><span>历史重复拦截</span></div>
      <div><strong>{metrics.lastSuccessfulPublishAt ? formatTime(metrics.lastSuccessfulPublishAt) : "暂无记录"}</strong><span>最近成功发布</span></div>
    </div>
    <div className="admin-table-wrap">
      <h3>最近运行记录</h3>
      <div className="data-table-wrap">
        <table className="admin-table"><thead><tr><th>时间</th><th>触发方式</th><th>状态</th><th>结果</th></tr></thead>
          <tbody>{runs.slice(0, 10).map((item) => <tr key={item.id}><td>{formatTime(item.completedAt)}</td><td>{item.trigger || "—"}</td><td>{item.status || "—"}</td><td>{item.publishResult?.published ? `已发布 ${item.publishResult.slug}` : item.reason || item.publishResult?.reason || "无发布结果"}</td></tr>)}
            {!runs.length ? <tr><td colSpan="4" className="admin-table-empty">暂无历史运行记录。</td></tr> : null}
          </tbody></table>
      </div>
    </div>
  </section>;
}

function formatTime(value) {
  return value ? new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false }) : "—";
}
