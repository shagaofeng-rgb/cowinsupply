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
          <h1>内外链审计</h1>
          <p>检查站内链接、外部链接、失效链接和孤立页面。</p>
        </div>
      </header>
      <section className="metric-grid">
        <MetricCard label="站内链接" value={audit.internal.length} hint="已发现" />
        <MetricCard label="外部链接" value={audit.external.length} hint="待同步" />
        <MetricCard label="失效链接" value={audit.broken.length} hint="待检测" />
        <MetricCard label="孤立页面" value={audit.orphanPages.length} hint="待检测" />
      </section>
      <DataTable
        columns={["来源页面", "目标链接", "锚文本", "状态"]}
        rows={audit.internal.map((item) => ({ cells: [item.from, item.to, item.anchor, item.status] }))}
        empty="暂无链接数据。"
      />
    </>
  );
}
