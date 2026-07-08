export default function AdminListControls({ action, keyword = "", status = "", pageSize = 20, statusOptions = [] }) {
  return (
    <form className="admin-list-controls" action={action}>
      <label>
        关键词
        <input name="q" defaultValue={keyword} placeholder="输入标题、分类、邮箱或产品" />
      </label>
      {statusOptions.length ? (
        <label>
          状态
          <select name="status" defaultValue={status}>
            <option value="">全部状态</option>
            {statusOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
      ) : null}
      <label>
        每页数量
        <select name="pageSize" defaultValue={String(pageSize)}>
          <option value="10">10 条</option>
          <option value="20">20 条</option>
          <option value="50">50 条</option>
          <option value="100">100 条</option>
        </select>
      </label>
      <button className="admin-button" type="submit">筛选</button>
    </form>
  );
}
