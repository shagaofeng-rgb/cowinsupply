"use client";

export default function AdminPageError({ retry, reset }) {
  return <section className="data-hero"><div role="alert"><h1>暂时无法加载此页面</h1><p>请重试，或从导航进入其他栏目。</p></div><button type="button" className="admin-primary-btn" onClick={() => (retry || reset)()}>重新加载</button></section>;
}
