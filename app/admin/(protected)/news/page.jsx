import AdminListControls from "@/components/admin/AdminListControls";
import ContentTable from "@/components/admin/ContentTable";
import Pagination from "@/components/admin/Pagination";
import { getCmsItems, paginateItems } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function AdminNewsPage({ searchParams }) {
  const params = await searchParams;
  const allNews = await getCmsItems("news", { includeInactive: true });
  const result = paginateItems(allNews, params);
  return <>
    <header className="admin-page-head"><div><h1>新闻管理</h1><p>News 自动发布已完全移除。此页面仅管理已有新闻和人工新增内容。</p></div></header>
    <AdminListControls action="/admin/news" keyword={params?.q} status={params?.status} pageSize={result.pageSize} statusOptions={[{ value: "published", label: "已发布" }, { value: "offline", label: "已下线" }, { value: "draft", label: "草稿" }]} />
    <section className="admin-two-col"><div><ContentTable items={result.items} type="news" /><Pagination basePath="/admin/news" page={result.page} pageSize={result.pageSize} total={result.total} query={params} /></div>
      <form className="admin-form admin-card" action="/api/admin/content/news" method="post"><input name="action" type="hidden" value="save" /><h2>人工新增新闻</h2><label>新闻标题<input name="title" required /></label><label>URL Slug<input name="slug" placeholder="company-update" /></label><label>分类<input name="category" placeholder="Company News" /></label><label>图片地址<input name="image" placeholder="/cowin-assets/scene-news-grinder.webp" /></label><label>摘要<textarea name="summary" /></label><label>正文<textarea name="content" /></label><button type="submit">保存为草稿</button></form>
    </section>
  </>;
}
