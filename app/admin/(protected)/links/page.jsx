import { DataTable, MetricCard } from "@/components/admin/DataPanels";
import { getLinkAudit } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function LinksPage() {
  const audit = await getLinkAudit();
  return (
    <>
      <header className="data-hero">
        <div>
          <small>链接审计</small>
          <h1>内外链清单</h1>
          <p>根据当前已发布的产品和新闻路由，列出站内链接；目前尚未执行全站链接爬取。</p>
        </div>
      </header>
      <section className="metric-grid">
        <MetricCard label="站内路由链接" value={audit.internal.length} hint="来自内容路由清单" />
        <MetricCard label="外部链接" value={null} hint="尚未检测" />
        <MetricCard label="失效链接" value={null} hint="尚未检测" />
        <MetricCard label="孤立页面" value={null} hint="尚未检测" />
      </section>
      <DataTable
        columns={["来源页面", "目标链接", "锚文本", "状态"]}
        rows={audit.internal.map((item) => ({ cells: [item.from, item.to, item.anchor, item.status] }))}
        empty="暂无链接数据。"
      />
      <p className="admin-data-footnote">当前数字不是爬虫检测结果；未检测项目以“—”显示，不能解读为 0 条问题。</p>
    </>
  );
}
