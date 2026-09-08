export { default as RangeBox } from "./RangeBox";

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
      <strong>数据链路状态</strong>
      <span>
        访客路径：{sync?.trackingState === "active" ? `最新 ${new Date(sync.trackingLastEvent).toLocaleString("zh-CN")}` : "等待首个真实访问"}；
        后台任务：{sync?.cronConfigured ? (lastRun ? `最近 ${new Date(lastRun.createdAt).toLocaleString("zh-CN")}` : "已配置，等待首条运行记录") : "未配置"}；
        状态：{lastRun?.status || "可用"}
      </span>
    </div>
  );
}
