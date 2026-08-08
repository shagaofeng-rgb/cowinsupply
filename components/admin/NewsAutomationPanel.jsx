"use client";

import { useState } from "react";

export default function NewsAutomationPanel({ dashboard }) {
  const [data, setData] = useState(dashboard);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [timezone, setTimezone] = useState(dashboard.config.timezone);
  const [scheduleHour, setScheduleHour] = useState(String(dashboard.config.scheduleHour));
  const [sources, setSources] = useState(JSON.stringify(dashboard.config.sourceWhitelist, null, 2));
  const [blacklist, setBlacklist] = useState((dashboard.config.sourceBlacklist || []).join("\n"));

  async function call(action, extra = {}) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/news/automation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...extra })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "Operation failed");
      const fresh = await fetch("/api/admin/news/automation", { cache: "no-store" }).then((item) => item.json());
      if (fresh.success) setData(fresh.data);
      setMessage(action === "dry-run" ? "模拟完成，未创建或发布文章。" : "操作已完成。");
    } catch (error) {
      setMessage(`操作失败：${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  function saveConfig() {
    let sourceWhitelist;
    try {
      sourceWhitelist = JSON.parse(sources);
      if (!Array.isArray(sourceWhitelist)) throw new Error("来源必须是 JSON 数组");
    } catch (error) {
      setMessage(`来源配置格式错误：${error.message}`);
      return;
    }
    call("config", {
      config: {
        enabled: data.config.enabled,
        timezone,
        scheduleHour: Number(scheduleHour),
        publishIntervalHours: 48,
        sourceWhitelist,
        sourceBlacklist: blacklist.split("\n").map((item) => item.trim()).filter(Boolean)
      }
    });
  }

  return <section className="admin-card news-automation-panel">
    <div className="news-automation-heading"><div><h2>News 自动运营 v2</h2><p>仅 News 启用自动抓取、核验与发布；Blog 自动发布保持关闭。每 48 小时最多发布 1 篇。</p></div><span className={data.config.enabled ? "status-good" : "status-muted"}>{data.config.enabled ? "已启用" : "已暂停"}</span></div>
    <div className="admin-kpis"><div><strong>{data.metrics.publishedByV2}</strong><span>自动发布</span></div><div><strong>{data.metrics.needsReview}</strong><span>待复核</span></div><div><strong>{data.metrics.duplicateBlocked}</strong><span>重复拦截</span></div><div><strong>{data.metrics.lastSuccessfulPublishAt ? new Date(data.metrics.lastSuccessfulPublishAt).toLocaleString("zh-CN") : "尚无"}</strong><span>最近成功发布</span></div></div>
    <div className="admin-actions"><button type="button" disabled={busy} onClick={() => call("dry-run")}>模拟运行</button><button type="button" disabled={busy} onClick={() => call("run")}>立即执行一次</button><button type="button" disabled={busy} onClick={() => call("config", { config: { ...data.config, enabled: !data.config.enabled } })}>{data.config.enabled ? "暂停自动化" : "启用自动化"}</button></div>
    <section className="admin-form admin-card"><h3>调度与来源配置</h3><label>运营时区<select value={timezone} onChange={(event) => setTimezone(event.target.value)}><option value="Asia/Shanghai">Asia/Shanghai</option><option value="UTC">UTC</option></select></label><label>计划发布小时（仅用于运营记录）<input type="number" min="0" max="23" value={scheduleHour} onChange={(event) => setScheduleHour(event.target.value)} /></label><label>来源白名单（JSON 数组）<textarea rows="10" value={sources} onChange={(event) => setSources(event.target.value)} spellCheck="false" /></label><label>来源黑名单（每行一个来源 ID）<textarea rows="3" value={blacklist} onChange={(event) => setBlacklist(event.target.value)} /></label><button type="button" disabled={busy} onClick={saveConfig}>保存运营配置</button></section>
    {message ? <p className="admin-notice">{message}</p> : null}
    <div className="admin-table-wrap"><h3>候选新闻池</h3><table className="admin-table"><thead><tr><th>状态</th><th>来源</th><th>关联产品</th><th>质量结果</th><th>操作</th></tr></thead><tbody>{data.candidates.slice(0, 12).map((item) => <tr key={item.id}><td>{item.status}</td><td><a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.source?.publisher || "来源"}</a><br />{item.sourceTitle}</td><td>{item.productSlugs?.join(", ") || "无"}</td><td>{item.rejectionReasons?.length ? item.rejectionReasons.join("；") : "已通过，等待发布窗口"}</td><td>{item.status !== "published" ? <button type="button" disabled={busy} onClick={() => call("archive", { id: item.id })}>归档</button> : item.articleSlug ? <button type="button" disabled={busy} onClick={() => call("withdraw", { slug: item.articleSlug })}>撤回</button> : null}</td></tr>)}</tbody></table></div>
    <div className="admin-table-wrap"><h3>最近执行日志</h3><table className="admin-table"><thead><tr><th>时间</th><th>触发</th><th>状态</th><th>结果</th></tr></thead><tbody>{data.runs.slice(0, 10).map((item) => <tr key={item.id}><td>{new Date(item.completedAt).toLocaleString("zh-CN")}</td><td>{item.trigger}</td><td>{item.status}</td><td>{item.publishResult?.published ? `已发布 ${item.publishResult.slug}` : item.reason || item.publishResult?.reason || "已完成"}</td></tr>)}</tbody></table></div>
  </section>;
}
