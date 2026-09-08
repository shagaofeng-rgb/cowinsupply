import Image from "next/image";
import AdminListControls from "@/components/admin/AdminListControls";
import Pagination from "@/components/admin/Pagination";
import { getMediaAssets, paginateItems } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage({ searchParams }) {
  const params = await searchParams;
  const result = paginateItems(await getMediaAssets({ limit: 500 }), params);
  const assets = result.items;

  return (
    <>
      <header className="admin-page-head">
        <div>
          <h1>媒体素材</h1>
          <p>查看 Cowin Supply 官网当前使用的真实图片和图标素材。</p>
        </div>
      </header>
      <AdminListControls action="/admin/media" keyword={params?.q} pageSize={result.pageSize} />
      <section className="admin-media-grid">
        {assets.map((asset) => (
          <article className="admin-media-card" key={asset.path}>
            <div className="admin-media-preview">
              <Image alt={asset.name} height={480} src={asset.path} width={640} />
            </div>
            <strong title={asset.name}>{asset.name}</strong>
            <span>{asset.type} · {formatSize(asset.size)}</span>
            <code>{asset.path}</code>
          </article>
        ))}
        {!assets.length ? <div className="admin-card">暂无媒体素材。</div> : null}
      </section>
      <Pagination basePath="/admin/media" page={result.page} pageSize={result.pageSize} total={result.total} query={params} />
    </>
  );
}

function formatSize(bytes) {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes > 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}
