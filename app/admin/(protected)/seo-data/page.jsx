import { DataTable, EmptyPanel, MetricCard, RangeBox } from "@/components/admin/DataPanels";
import { getSeoReport } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function SeoDataPage() {
  const report = await getSeoReport();

  return (
    <>
      <header className="data-hero">
        <div>
          <small>GOOGLE SEO</small>
          <h1>Search Console 数据</h1>
          <p>查看 Google Search Console 点击量、曝光量、点击率、平均排名、页面和关键词搜索表现。</p>
        </div>
        <RangeBox />
      </header>

      <div className={report.gscConnected ? "status-pill good" : "status-pill warn"}>
        {report.gscConnected ? "GSC 已连接" : report.gscConfigured ? "GSC 已配置但未连通" : "GSC 尚未配置"}
      </div>

      {report.gscError ? <div className="admin-alert">Search Console 状态：{statusText(report.gscError)}</div> : null}

      <section className="metric-grid">
        <MetricCard label="点击量" value={report.clicks} hint="GSC 指标" />
        <MetricCard label="曝光量" value={report.impressions} hint="GSC 指标" />
        <MetricCard label="点击率" value={`${report.ctr}%`} hint="平均值" />
        <MetricCard label="排名位置" value={report.position} hint="平均值" />
      </section>

      <section className="data-grid-two">
        <DataTable
          columns={["搜索词", "点击", "曝光", "点击率", "排名"]}
          rows={report.keywords.map((item) => ({
            cells: [item.query, item.clicks, item.impressions, `${item.ctr}%`, item.position]
          }))}
          empty={report.gscConfigured ? "暂无关键词数据，或当前时间范围没有搜索表现。" : "尚未配置 Search Console 凭证。"}
        />
        <section className="data-panel">
          <small>连接状态</small>
          <h2>Search Console API</h2>
          <div className="progress-row"><span>服务账号凭证</span><b>{report.gscConfigured ? "已配置" : "未配置"}</b></div>
          <div className="progress-row"><span>搜索数据连接</span><b>{report.gscConnected ? "已连接" : "未连接"}</b></div>
          <div className="progress-row"><span>站点属性</span><b>{report.gscSiteUrl || "sc-domain:cowinsupply.com"}</b></div>
          <p className="admin-muted">如果显示权限错误，请在 Google Search Console 里把服务账号邮箱添加为用户。</p>
        </section>
      </section>

      <section className="data-grid-two">
        <DataTable
          columns={["落地页", "点击", "曝光", "点击率", "排名"]}
          rows={report.landingPages.map((item) => ({
            cells: [item.page, item.clicks, item.impressions, `${item.ctr}%`, item.position]
          }))}
          empty="暂无落地页数据。"
        />
        <DataTable
          columns={["国家/地区", "点击", "曝光"]}
          rows={report.markets.map((item) => ({
            cells: [item.country, item.clicks, item.impressions]
          }))}
          empty="暂无市场搜索数据。"
        />
      </section>

      <section className="data-panel">
        <small>问题中心</small>
        <h2>SEO 问题检测</h2>
        <DataTable
          columns={["级别", "问题", "页面"]}
          rows={report.issues.map((item) => ({ cells: [item.level, item.issue, item.page] }))}
          empty="当前未检测到 SEO 问题。"
        />
      </section>

      {!report.gscConfigured ? <EmptyPanel title="配置提示" eyebrow="Google Search Console">请先部署服务账号环境变量，并确认该服务账号已加入 cowinsupply.com 的 Search Console 属性。</EmptyPanel> : null}
    </>
  );
}

function statusText(value) {
  const map = {
    "service-account-no-search-console-permission": "服务账号还没有 Search Console 权限",
    "google-api-network-error": "Google API 网络连接失败",
    "not-configured": "未配置服务账号凭证"
  };
  return map[value] || value;
}
