import AdminListControls from "@/components/admin/AdminListControls";
import ContentTable from "@/components/admin/ContentTable";
import { DataTable, MetricCard } from "@/components/admin/DataPanels";
import Pagination from "@/components/admin/Pagination";
import { getCmsItems, paginateItems } from "@/lib/cmsStore";
import { getNewsAutomationDashboard } from "@/lib/newsAutomation";

export const dynamic = "force-dynamic";

export default async function AdminNewsPage({ searchParams }) {
  const params = await searchParams;
  const allNews = await getCmsItems("news", { includeInactive: true });
  const result = paginateItems(allNews, params);
  const automation = await getNewsAutomationDashboard();

  return (
    <>
      <header className="admin-page-head">
        <div>
          <h1>新闻管理</h1>
          <p>管理 Cowin Supply 官网当前新闻内容、自动采集任务、来源配置和每日发布审计。</p>
        </div>
      </header>

      <section className="metric-grid">
        <MetricCard label="今日发布" value={automation.todayCount} hint={`目标 ${automation.config.dailyTarget} 篇`} />
        <MetricCard label="新闻来源" value={automation.sources.length} hint="RSS / API 来源" />
        <MetricCard label="自动发布" value={automation.config.autoPublish ? "开启" : "审核"} hint={automation.config.timezone} />
        <MetricCard label="最近任务" value={automation.jobs[0]?.status || "暂无"} hint={automation.jobs[0]?.completedAt ? new Date(automation.jobs[0].completedAt).toLocaleString("zh-CN") : "未运行"} />
      </section>

      <section className="admin-card admin-section">
        <h2>News 自动化</h2>
        <p className="admin-muted">系统会采集配置来源中 72 小时内的公开新闻，执行 7 天游标去重和产品相关性判断；没有有效来源时不会伪造新闻。</p>
        <div className="admin-actions">
          <form action="/api/admin/news/collect" method="post"><button type="submit">执行采集发布</button></form>
          <form action="/api/admin/news/retry" method="post"><button type="submit">重试补发</button></form>
        </div>
      </section>

      <AdminListControls
        action="/admin/news"
        keyword={params?.q}
        status={params?.status}
        pageSize={result.pageSize}
        statusOptions={[
          { value: "published", label: "已发布" },
          { value: "offline", label: "已下线" },
          { value: "draft", label: "草稿" }
        ]}
      />

      <section className="admin-two-col">
        <div>
          <ContentTable items={result.items} type="news" />
          <Pagination basePath="/admin/news" page={result.page} pageSize={result.pageSize} total={result.total} query={params} />
        </div>
        <form className="admin-form admin-card" action="/api/admin/content/news" method="post">
          <input name="action" type="hidden" value="save" />
          <h2>新增新闻</h2>
          <label>新闻标题<input name="title" required /></label>
          <label>URL Slug<input name="slug" placeholder="industry-update" /></label>
          <label>分类<input name="category" placeholder="Industry News" /></label>
          <label>图片地址<input name="image" placeholder="/cowin-assets/scene-news-grinder.webp" /></label>
          <label>摘要<textarea name="summary" /></label>
          <button type="submit">保存新闻</button>
        </form>
      </section>

      <section className="admin-two-col admin-section">
        <DataTable
          columns={["来源", "类型", "语言", "可信度", "状态"]}
          rows={automation.sources.map((source) => ({
            cells: [source.publisherName || source.domain, source.sourceType || source.source_type, source.language, source.credibilityScore || source.credibility_score, source.enabled === false ? "停用" : "启用"]
          }))}
          empty="尚未配置 NEWS_SOURCE_FEEDS。"
        />
        <DataTable
          columns={["日期", "目标", "已发布", "缺口", "状态"]}
          rows={automation.audits.slice(0, 8).map((audit) => ({
            cells: [audit.date, audit.targetCount, audit.publishedCount, audit.missingCount, audit.status]
          }))}
          empty="暂无每日发布审计。"
        />
      </section>

      <section className="admin-section">
        <DataTable
          columns={["时间", "任务", "状态", "发布", "错误"]}
          rows={automation.jobs.slice(0, 12).map((job) => ({
            cells: [new Date(job.startedAt).toLocaleString("zh-CN"), job.jobType, job.status, job.metadata?.published ?? 0, job.errorMessage || "-"]
          }))}
          empty="暂无 News 自动化任务。"
        />
      </section>
    </>
  );
}
