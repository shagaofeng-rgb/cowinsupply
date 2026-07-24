import fs from "node:fs/promises";
import path from "node:path";
import { getCmsItems } from "@/lib/cmsStore";

const HTML_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "public, max-age=0, must-revalidate"
};

export async function publicHtmlResponse(relativePath, { canonicalPath = "" } = {}) {
  const publicRoot = path.resolve(/* turbopackIgnore: true */ process.cwd(), "public");
  const filePath = path.resolve(publicRoot, relativePath);

  if (filePath !== publicRoot && !filePath.startsWith(`${publicRoot}${path.sep}`)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const html = await fs.readFile(filePath, "utf8");
    const withRelatedNews = await injectRelatedNews(html, relativePath);
    return new Response(injectTracking(injectSeo(withRelatedNews, canonicalPath)), { headers: HTML_HEADERS });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

async function injectRelatedNews(html, relativePath) {
  const match = String(relativePath).match(/^product\/([^/]+?)(?:\.html)?$/i);
  if (!match) return html;

  const slug = match[1].replace(/\.html$/i, "");
  const [products, news] = await Promise.all([getCmsItems("product"), getCmsItems("news")]);
  const product = products.find((item) => item.slug === slug);
  if (!product) return html;

  const related = news
    .filter((item) => (item.relatedProducts || []).some((entry) => entry.productSlug === product.slug || entry.productId === product.id))
    .slice(0, 3);
  if (!related.length || html.includes('id="related-industry-news"')) return html;

  const section = `<section id="related-industry-news" class="related-industry-news" aria-labelledby="related-industry-news-title"><div class="container"><h2 id="related-industry-news-title">Related Industry News</h2><p>Recent public-source analysis connected to this product category.</p><ul>${related.map((item) => `<li><a href="/news/${escapeHtml(item.slug)}">${escapeHtml(item.title)}</a><span>${escapeHtml(item.sourcePublisher || "Cowin Supply")}</span></li>`).join("")}</ul></div></section><style>.related-industry-news{padding:56px 0;background:#f6f8fb}.related-industry-news h2{margin:0 0 10px}.related-industry-news ul{margin:20px 0 0;padding:0;list-style:none;display:grid;gap:10px}.related-industry-news li{display:flex;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid #d9e1ea}.related-industry-news a{font-weight:700}.related-industry-news span{color:#667085;font-size:.9rem}@media(max-width:640px){.related-industry-news li{display:block}.related-industry-news span{display:block;margin-top:6px}}</style>`;
  return /<\/footer>/i.test(html) ? html.replace(/<\/footer>/i, `</footer>${section}`) : `${html}${section}`;
}

function injectSeo(html, canonicalPath) {
  if (!canonicalPath) return html;

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.cowinsupply.com").replace(/\/$/, "");
  const normalizedPath = canonicalPath === "/" ? "/" : `/${String(canonicalPath).replace(/^\/+|\/+$/g, "")}`;
  const canonicalUrl = `${siteUrl}${normalizedPath}`;
  const tags = [
    `<link rel="canonical" href="${escapeAttr(canonicalUrl)}">`,
    '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">',
    `<meta property="og:url" content="${escapeAttr(canonicalUrl)}">`
  ].join("\n  ");

  let next = html
    .replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/<meta\b[^>]*\bname=["']robots["'][^>]*>\s*/gi, "")
    .replace(/<meta\b[^>]*\bproperty=["']og:url["'][^>]*>\s*/gi, "");
  next = next.replace(/<html(?![^>]*\blang=)([^>]*)>/i, '<html lang="en"$1>');
  return /<\/head>/i.test(next) ? next.replace(/<\/head>/i, `  ${tags}\n</head>`) : `${tags}\n${next}`;
}

function escapeAttr(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function injectTracking(html) {
  if (html.includes("/api/track")) return html;
  const script = `<script>
(function(){
  try {
    var visitorKey = "cowinsupply_visitor_id";
    var sessionKey = "cowinsupply_session_id";
    var visitorId = localStorage.getItem(visitorKey);
    if (!visitorId) {
      visitorId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random());
      localStorage.setItem(visitorKey, visitorId);
    }
    var sessionId = sessionStorage.getItem(sessionKey);
    if (!sessionId) {
      sessionId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random());
      sessionStorage.setItem(sessionKey, sessionId);
    }
    var payload = JSON.stringify({
      path: location.pathname,
      title: document.title,
      referrer: document.referrer,
      language: navigator.language,
      screen: screen.width + "x" + screen.height,
      visitorId: visitorId,
      sessionId: sessionId
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true });
    }
  } catch (error) {}
})();
</script>`;
  return html.includes("</body>") ? html.replace("</body>", `${script}</body>`) : `${html}${script}`;
}
