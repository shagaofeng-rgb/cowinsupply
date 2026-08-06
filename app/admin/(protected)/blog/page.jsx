import AdminListControls from "@/components/admin/AdminListControls";
import ContentTable from "@/components/admin/ContentTable";
import Pagination from "@/components/admin/Pagination";
import { getCmsItems, paginateItems } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage({ searchParams }) {
  const params = await searchParams;
  const result = paginateItems(await getCmsItems("blog", { includeInactive: true }), params);

  return (
    <>
      <header className="admin-page-head"><div><h1>Blog 管理</h1><p>管理插件发布和人工创建的真实 Blog 文章。前台仅显示已发布内容。</p></div></header>
      <AdminListControls
        action="/admin/blog"
        keyword={params?.q}
        status={params?.status}
        pageSize={result.pageSize}
        statusOptions={[{ value: "published", label: "已发布" }, { value: "offline", label: "已下线" }, { value: "draft", label: "草稿" }]}
      />
      <section className="admin-two-col"><div><ContentTable items={result.items} type="blog" /><Pagination basePath="/admin/blog" page={result.page} pageSize={result.pageSize} total={result.total} query={params} /></div>
        <form className="admin-form admin-card" action="/api/admin/content/blog" method="post">
          <input name="action" type="hidden" value="save" />
          <h2>新增 Blog 文章</h2>
          <label>标题<input name="title" required /></label>
          <label>URL Slug<input name="slug" placeholder="blog-article-title" /></label>
          <label>分类<input name="category" defaultValue="blog" /></label>
          <label>作者<input name="authorName" defaultValue="admin" /></label>
          <label>封面图 URL<input name="image" placeholder="https://example.com/cover.jpg" /></label>
          <label>摘要<textarea name="summary" /></label>
          <label>正文<textarea name="content" required /></label>
          <button type="submit">发布文章</button>
        </form>
      </section>
    </>
  );
}
