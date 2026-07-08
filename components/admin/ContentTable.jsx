export default function ContentTable({ items, type }) {
  return (
    <div className="admin-table-card">
      <table className="admin-table">
        <thead>
          <tr>
            <th>标题</th>
            <th>分类</th>
            <th>状态</th>
            <th>更新</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={`${item.type}-${item.slug}`}>
              <td>
                <strong>{item.title}</strong>
                <br />
                <span className="admin-muted">/{type === "product" ? "product" : "news"}/{item.slug}.html</span>
              </td>
              <td>{item.category || "-"}</td>
              <td><span className="admin-badge">{statusLabel(item.status)}</span></td>
              <td>{new Date(item.updatedAt || item.createdAt).toLocaleString("zh-CN")}</td>
              <td>
                <div className="admin-actions">
                  <form action={`/api/admin/content/${type}`} method="post">
                    <input name="action" type="hidden" value={item.status === "published" ? "offline" : "publish"} />
                    <input name="slug" type="hidden" value={item.slug} />
                    <button type="submit">{item.status === "published" ? "下线" : "发布"}</button>
                  </form>
                  <form action={`/api/admin/content/${type}`} method="post">
                    <input name="action" type="hidden" value="delete" />
                    <input name="slug" type="hidden" value={item.slug} />
                    <button className="danger" type="submit">删除</button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
          {!items.length ? (
            <tr><td colSpan="5">暂无内容。</td></tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function statusLabel(status) {
  const labels = {
    published: "已发布",
    offline: "已下线",
    draft: "草稿",
    archived: "已归档",
    new: "新询盘"
  };
  return labels[status] || status || "-";
}
