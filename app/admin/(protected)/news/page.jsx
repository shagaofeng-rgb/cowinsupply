import AdminListControls from "@/components/admin/AdminListControls";
import ContentTable from "@/components/admin/ContentTable";
import NewsAutomationPanel from "@/components/admin/NewsAutomationPanel";
import Pagination from "@/components/admin/Pagination";
import { getCmsItems, paginateItems } from "@/lib/cmsStore";
import { getNewsAutomationDashboard } from "@/lib/newsAutomationV2";

export const dynamic = "force-dynamic";

export default async function AdminNewsPage({ searchParams }) {
  const params = await searchParams;
  const [allNews, dashboard] = await Promise.all([getCmsItems("news", { includeInactive: true }), getNewsAutomationDashboard()]);
  const result = paginateItems(allNews, params);
  return <>
    <header className="admin-page-head"><div><h1>新闻管理</h1><p>News 自动运营每日最多发布 1 篇，并采用来源、原创度、产品关联、版权、SEO 与前台可见性门禁。Blog 自动发布保持关闭。</p></div></header>
    <NewsAutomationPanel dashboard={dashboard} />
    <AdminListControls action="/admin/news" keyword={params?.q} status={params?.status} pageSize={result.pageSize} statusOptions={[{ value: "published", label: "已发布" }, { value: "offline", label: "已下线" }, { value: "draft", label: "草稿" }]} />
    <section className="admin-two-col"><div><ContentTable items={result.items} type="news" /><Pagination basePath="/admin/news" page={result.page} pageSize={result.pageSize} total={result.total} query={params} /></div>
      <form className="admin-form admin-card" action="/api/admin/content/news" method="post"><input name="action" type="hidden" value="save" /><h2>人工新增新闻</h2><label>新闻标题<input name="title" required /></label><label>URL Slug<input name="slug" placeholder="industry-update" /></label><label>分类<input name="category" placeholder="Industry News" /></label><label>图片地址<input name="image" placeholder="/cowin-assets/product-image.webp" /></label><label>摘要<textarea name="summary" /></label><label>正文<textarea name="content" /></label><button type="submit">保存并发布</button></form>
    </section>
  </>;
}
