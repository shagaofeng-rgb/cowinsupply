import Link from "next/link";
import { IconChartBar } from "@tabler/icons-react";

export { default as RangeBox } from "./RangeBox";

export function MetricCard({ label, value, hint, icon: Icon = IconChartBar, href }) {
  const content = <>
    <span className="metric-card-icon"><Icon size={22} stroke={1.8} aria-hidden="true" /></span>
    <span className="metric-card-label">{label}</span>
    <strong>{value === null || value === undefined ? "—" : value}</strong>
    <small>{hint}</small>
  </>;
  return (
    href ? <Link className="metric-card metric-card-link" href={href}>{content}</Link> : <section className="metric-card">{content}</section>
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

export function DataTable({ columns, rows, empty = "暂无数据。", title, href }) {
  return (
    <div className="data-table-wrap">
      {title ? <div className="data-table-heading"><h2>{title}</h2>{href ? <Link href={href}>查看全部</Link> : null}</div> : null}
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
          {!rows.length ? <tr><td className="admin-table-empty" colSpan={columns.length}>{empty}</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}

export function SyncStrip({ sync }) {
  const lastRun = sync?.lastRun;
  return (
    <div className="sync-strip">
      <strong>数据状态</strong>
      <span>
        访问事件：{sync?.trackingState === "active" ? `最近 ${new Date(sync.trackingLastEvent).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })}` : "尚无访问记录"}；
        同步日志：{lastRun ? `最近 ${new Date(lastRun.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })} · ${lastRun.status}` : "暂无运行记录"}
      </span>
    </div>
  );
}
