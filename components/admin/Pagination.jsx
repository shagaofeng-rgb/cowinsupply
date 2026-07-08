import Link from "next/link";

export default function Pagination({ basePath, page, pageSize, total, query = {} }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const makeHref = (nextPage) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params.set(key, value);
    });
    params.set("page", String(nextPage));
    params.set("pageSize", String(pageSize));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="admin-pagination">
      <span>共 {total} 条，第 {page} / {totalPages} 页</span>
      <div>
        {page > 1 ? <Link href={makeHref(page - 1)}>上一页</Link> : <span>上一页</span>}
        {page < totalPages ? <Link href={makeHref(page + 1)}>下一页</Link> : <span>下一页</span>}
      </div>
    </div>
  );
}
