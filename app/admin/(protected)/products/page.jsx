import AdminListControls from "@/components/admin/AdminListControls";
import ContentTable from "@/components/admin/ContentTable";
import Pagination from "@/components/admin/Pagination";
import { getCmsItems, paginateItems } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({ searchParams }) {
  const params = await searchParams;
  const allProducts = await getCmsItems("product", { includeInactive: true });
  const result = paginateItems(allProducts, params);

  return (
    <>
      <header className="admin-page-head">
        <div>
          <h1>产品管理</h1>
          <p>管理 Cowin Supply 官网当前产品内容，支持搜索、状态筛选、分页和上下线。</p>
        </div>
      </header>

      <AdminListControls
        action="/admin/products"
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
          <ContentTable items={result.items} type="product" />
          <Pagination basePath="/admin/products" page={result.page} pageSize={result.pageSize} total={result.total} query={params} />
        </div>
        <form className="admin-form admin-card" action="/api/admin/content/product" method="post">
          <input name="action" type="hidden" value="save" />
          <h2>新增产品</h2>
          <label>产品标题<input name="title" required /></label>
          <label>URL Slug<input name="slug" placeholder="example-product" /></label>
          <label>分类<input name="category" placeholder="Wall Chasers" /></label>
          <label>图片地址<input name="image" placeholder="/cowin-assets/product-jigsaw.webp" /></label>
          <label>简介<textarea name="summary" /></label>
          <button type="submit">保存产品</button>
        </form>
      </section>
    </>
  );
}
