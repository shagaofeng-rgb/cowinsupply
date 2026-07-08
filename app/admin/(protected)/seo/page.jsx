import Link from "next/link";
import { getCmsItems, getSiteSettings } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  const [settings, products, news] = await Promise.all([
    getSiteSettings(),
    getCmsItems("product"),
    getCmsItems("news")
  ]);

  return (
    <>
      <header className="admin-page-head">
        <div>
          <h1>SEO 设置</h1>
          <p>维护 Cowin Supply 当前站点标题、描述、收录入口和公开内容索引。</p>
        </div>
      </header>

      <section className="admin-two-col">
        <form className="admin-form admin-card" action="/api/admin/settings" method="post">
          <h2>基础 SEO</h2>
          <label>SEO 标题<input name="seoTitle" defaultValue={settings.seoTitle} /></label>
          <label>SEO 描述<textarea name="seoDescription" defaultValue={settings.seoDescription} /></label>
          <label>站点域名<input name="siteUrl" defaultValue={settings.siteUrl} /></label>
          <label>Robots 路径<input name="robotsPath" defaultValue={settings.robotsPath} /></label>
          <label>Sitemap 路径<input name="sitemapPath" defaultValue={settings.sitemapPath} /></label>
          <button type="submit">保存 SEO 设置</button>
        </form>

        <div className="admin-card">
          <h2>收录检查</h2>
          <div className="admin-status-list">
            <StatusRow label="正式域名" value={settings.siteUrl} />
            <StatusRow label="产品索引" value={`${products.length} 条已发布`} />
            <StatusRow label="新闻索引" value={`${news.length} 条已发布`} />
            <StatusRow label="Robots" value={settings.robotsPath} href={settings.robotsPath} />
            <StatusRow label="Sitemap" value={settings.sitemapPath} href={settings.sitemapPath} />
            <StatusRow label="内容 API" value="/api/content/sitemap" href="/api/content/sitemap" />
          </div>
        </div>
      </section>
    </>
  );
}

function StatusRow({ label, value, href }) {
  return (
    <div className="admin-status-row">
      <span>{label}</span>
      {href ? <Link href={href}>{value}</Link> : <strong>{value}</strong>}
    </div>
  );
}
