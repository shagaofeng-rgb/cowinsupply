import { getMediaAssets } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const assets = await getMediaAssets({ limit: 120 });

  return (
    <>
      <header className="admin-page-head">
        <div>
          <h1>媒体素材</h1>
          <p>查看 Cowin Supply 官网当前使用的真实图片和图标素材。</p>
        </div>
      </header>

      <section className="admin-media-grid">
        {assets.map((asset) => (
          <article className="admin-media-card" key={asset.path}>
            <div className="admin-media-preview">
              <img alt={asset.name} src={asset.path} />
            </div>
            <strong title={asset.name}>{asset.name}</strong>
            <span>{asset.type} · {formatSize(asset.size)}</span>
            <code>{asset.path}</code>
          </article>
        ))}
        {!assets.length ? <div className="admin-card">暂无媒体素材。</div> : null}
      </section>
    </>
  );
}

function formatSize(bytes) {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes > 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}
