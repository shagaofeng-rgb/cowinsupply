import { getCategorySummary } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getCategorySummary();

  return (
    <>
      <header className="admin-page-head">
        <div>
          <h1>分类管理</h1>
          <p>按 Cowin Supply 当前产品和新闻内容自动汇总分类，便于检查栏目结构。</p>
        </div>
      </header>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>分类名称</th>
              <th>产品数</th>
              <th>新闻数</th>
              <th>已发布</th>
              <th>总内容</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((item) => (
              <tr key={item.name}>
                <td><strong>{item.name}</strong></td>
                <td>{item.products}</td>
                <td>{item.news}</td>
                <td>{item.published}</td>
                <td><span className="admin-badge">{item.total}</span></td>
              </tr>
            ))}
            {!categories.length ? <tr><td colSpan="5">暂无分类。</td></tr> : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
