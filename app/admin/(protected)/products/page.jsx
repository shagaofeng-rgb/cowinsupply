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
          <p>管理真实产品数据、发布状态、SEO 与待确认参数。删除为软删除，产品 URL 不会被立即移除。</p>
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
          { value: "draft", label: "草稿" },
          { value: "deleted", label: "已软删除" }
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
          <label>型号<input name="model" /></label>
          <label>分类名称<input name="category" placeholder="Wall Chasers" /></label>
          <label>分类 Slug<input name="categorySlug" placeholder="wall-chasers" /></label>
          <label>主图地址<input name="image" placeholder="/cowin-assets/product-jigsaw.webp" /></label>
          <label>产品概述<textarea name="summary" /></label>
          <label>卖点 JSON 数组<textarea name="features" placeholder={'["Verified feature one"]'} /></label>
          <label>应用场景 JSON 数组<textarea name="applications" placeholder={'["Application one"]'} /></label>
          <label>参数 JSON 数组<textarea name="specifications" placeholder={'[{"label":"Rated Power","value":"...","verified":true}]'} /></label>
          <label>FAQ JSON 数组<textarea name="faq" placeholder={'[{"question":"...","answer":"..."}]'} /></label>
          <label>SEO 标题<input name="seoTitle" /></label>
          <label>SEO 描述<textarea name="seoDescription" /></label>
          <label>参数状态<select name="parameterStatus"><option value="pending-confirmation">待确认</option><option value="verified">已确认</option></select></label>
          <label>保存状态<select name="status"><option value="draft">草稿</option><option value="published">发布</option></select></label>
          <button type="submit">保存产品</button>
        </form>
      </section>
    </>
  );
}
