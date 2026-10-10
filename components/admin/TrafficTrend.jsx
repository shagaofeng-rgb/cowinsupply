export default function TrafficTrend({ series = [], range, title = "访问趋势" }) {
  const total = series.reduce((sum, item) => sum + item.pv, 0);
  const maximum = Math.max(1, ...series.map((item) => item.pv));
  const weekly = series.some((item) => item.day.includes("–"));

  return <section className="data-panel traffic-trend">
    <div className="data-panel-heading"><div><small>站内访问事件 · {range?.from} 至 {range?.to}</small><h2>{title}</h2></div><span>{weekly ? "按 7 天分组" : "按日"}</span></div>
    {!series.length || total === 0 ? <div className="empty-line">所选时间范围暂无访问记录。网站产生访问事件后，趋势会在这里显示。</div> : <>
      <div className="traffic-bars" role="img" aria-label={`${title}。${series.map((item) => `${item.day}：${item.pv} 次`).join("；")}`}>
        {series.map((item) => <div className="traffic-bar-group" key={item.day} title={`${item.day}：${item.pv} 次`}>
          <strong>{item.pv}</strong><span className="traffic-bar-track"><span className="traffic-bar-fill" style={{ height: `${item.pv / maximum * 100}%` }} /></span><small>{item.day}</small>
        </div>)}
      </div>
      <p className="admin-chart-note">柱形表示该日期内记录的页面访问事件次数；具体值可通过柱形提示或上方替代说明读取。</p>
    </>}
  </section>;
}
