export function RangeBox() {
  return (
    <div className="range-box">
      <small>时间范围</small>
      <span>当前查看：今日，2026-07-08 至 2026-07-08</span>
      <div>
        <button className="is-active" type="button">日</button>
        <button type="button">周</button>
        <button type="button">月</button>
        <button type="button">自定义</button>
      </div>
      <button className="range-refresh" type="button">刷新当前范围</button>
    </div>
  );
}

export function MetricCard({ label, value, hint }) {
  return (
    <section className="metric-card">
      <i />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </section>
  );
}

export function EmptyPanel({ title, eyebrow, children = "暂无可展示数据，收到更多访问后这里会自动生成图表。" }) {
  return (
    <section className="data-panel">
      {eyebrow ? <small>{eyebrow}</small> : null}
      <h2>{title}</h2>
      <div className="empty-line">{children}</div>
    </section>
  );
}

export function DataTable({ columns, rows, empty = "暂无数据。" }) {
  return (
    <div className="data-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || row.path || row.url || index}>
              {row.cells.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
            </tr>
          ))}
          {!rows.length ? <tr><td colSpan={columns.length}>{empty}</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}

export function SyncStrip({ sync }) {
  const lastRun = sync?.lastRun;
  return (
    <div className="sync-strip">
      <strong>30 分钟自动同步已配置</strong>
      <span>
        前端刷新：已接入；Cron 最近执行：
        {lastRun ? new Date(lastRun.createdAt).toLocaleString("zh-CN") : "暂无记录"}；
        状态：{lastRun?.status || "等待首次数据"}
      </span>
    </div>
  );
}
