import fs from "node:fs/promises";
import path from "node:path";

const cwd = process.cwd();
const publicDir = path.join(cwd, "public");
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.cowinsupply.com").replace(/\/$/, "");
const targets = [];

await addFile("index.html", "/");
await addFile("product/index.html", "/product");
await addFile("news/index.html", "/news");
await addFile("about/index.html", "/about");
await addFile("contact/index.html", "/contact");
await addFile("message/index.html", "/message");

for (const entry of await readDir("product")) {
  if (!entry.isFile() || !entry.name.endsWith(".html") || entry.name.startsWith("index")) continue;
  await addFile(path.join("product", entry.name), `/product/${encodeURIComponent(entry.name).replaceAll("%2E", ".")}`);
}

for (const entry of await readDir("tag")) {
  if (!entry.isDirectory()) continue;
  await addFile(path.join("tag", entry.name, "index.html"), `/tag/${encodeURIComponent(entry.name)}`);
}

console.log(JSON.stringify({ processed: targets.length, files: targets }, null, 2));

async function addFile(relativePath, canonicalPath) {
  const filePath = path.join(publicDir, relativePath);
  let html;
  try {
    html = await fs.readFile(filePath, "utf8");
  } catch {
    return;
  }

  const canonicalUrl = `${siteUrl}${canonicalPath}`;
  const tags = [
    `<link rel="canonical" href="${escapeAttr(canonicalUrl)}">`,
    '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">',
    `<meta property="og:url" content="${escapeAttr(canonicalUrl)}">`
  ].join("\n    ");
  const cleaned = html
    .replace(/[ \t]*<link\b[^>]*\brel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/[ \t]*<meta\b[^>]*\bname=["']robots["'][^>]*>\s*/gi, "")
    .replace(/[ \t]*<meta\b[^>]*\bproperty=["']og:url["'][^>]*>\s*/gi, "");
  const next = /<\/head>/i.test(cleaned) ? cleaned.replace(/<\/head>/i, `        ${tags}\n</head>`) : cleaned;
  const withRelatedNews = injectRelatedNews(next, relativePath);
  const withSharedChrome = injectSharedChrome(withRelatedNews, canonicalPath);
  if (withSharedChrome !== html) await fs.writeFile(filePath, withSharedChrome, "utf8");
  targets.push(relativePath.replaceAll(path.sep, "/"));
}

function injectRelatedNews(html, relativePath) {
  if (!relativePath.startsWith(`product${path.sep}`) || relativePath.endsWith(`${path.sep}index.html`) || html.includes('id="related-industry-news"')) return html;
  const slug = path.basename(relativePath, ".html");
  const safeSlug = JSON.stringify(slug);
  const section = `<section id="related-industry-news" class="related-industry-news" aria-labelledby="related-industry-news-title"><div class="container"><h2 id="related-industry-news-title">Related Industry News</h2><p>Recent public-source analysis connected to this product category.</p><ul data-news-list></ul></div></section><style>.related-industry-news{padding:56px 0;background:#f6f8fb}.related-industry-news h2{margin:0 0 10px}.related-industry-news ul{margin:20px 0 0;padding:0;list-style:none;display:grid;gap:10px}.related-industry-news li{display:flex;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid #d9e1ea}.related-industry-news a{font-weight:700}.related-industry-news span{color:#667085;font-size:.9rem}@media(max-width:640px){.related-industry-news li{display:block}.related-industry-news span{display:block;margin-top:6px}}</style><script>(function(){var root=document.getElementById('related-industry-news');var list=root&&root.querySelector('[data-news-list]');if(!list)return;fetch('/api/products/'+encodeURIComponent(${safeSlug})+'/news').then(function(r){return r.ok?r.json():null}).then(function(payload){var items=payload&&payload.data&&payload.data.news||[];if(!items.length){root.hidden=true;return}list.innerHTML=items.slice(0,3).map(function(item){return '<li><a href="/news/'+encodeURIComponent(item.slug)+'">'+escapeHtml(item.title)+'</a><span>'+escapeHtml(item.sourcePublisher||'Cowin Supply')+'</span></li>'}).join('')}).catch(function(){root.hidden=true});function escapeHtml(value){return String(value||'').replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]})}})();</script>`;
  return /<\/footer>/i.test(html) ? html.replace(/<\/footer>/i, `</footer>${section}`) : `${html}${section}`;
}

function injectSharedChrome(html, canonicalPath) {
  if (!/<header\b/i.test(html) || !/<footer\b/i.test(html)) return html;
  const activePath = ["/product", "/news", "/about", "/contact"].find((pathName) => canonicalPath === pathName || canonicalPath.startsWith(`${pathName}/`)) || "";
  const navItems = [["/product", "Products"], ["/news", "News"], ["/blog", "Blog"], ["/about", "About"], ["/contact", "Contact"]];
  const navLinks = navItems.map(([href, label]) => `<a href="${href}"${href === activePath ? ' class="is-active" aria-current="page"' : ""}>${label}</a>`).join("");
  const header = `<header class="site-header"><div class="container nav-wrap"><a class="brand" href="/"><img src="/cowin-assets/cowin-logo.png" alt="Cowin Supply logo"><span>Cowin Supply</span></a><nav class="main-nav" aria-label="Main navigation">${navLinks}</nav><a class="btn btn-dark header-cta" href="/contact#quote">Get Wholesale Price</a><button class="nav-toggle" type="button" aria-label="Open navigation" aria-expanded="false"><span></span><span></span><span></span></button></div></header>`;
  const footer = `<footer class="site-footer"><div class="container footer-grid"><div><h3>Cowin Supply</h3><p>Quzhou Qiying Import &amp; Export Co., Ltd.<br>No. 18, Sanxin Road, Lanjiang Sub-district, Lanxi City, Jinhua City, Zhejiang Province, China</p></div><div><h3>Products</h3><a href="/product">All Products</a><a href="/product/6000wsolttingmachine.html">Wall Chasers</a><a href="/product/LaserMeasuringDevicwithMultiFunction.html">Measuring Tools</a></div><div><h3>Resources</h3><a href="/news">News</a><a href="/blog">Blog</a><a href="/about">About</a><a href="/contact">Contact</a></div><div><h3>Contact</h3><a href="tel:+8617601255205">+8617601255205</a><a href="mailto:davidsha@cowinsupply.com">davidsha@cowinsupply.com</a></div></div><div class="footer-bottom"><div class="container">Copyright 2026 Cowin Supply. All rights reserved.</div></div></footer>`;
  return html.replace(/<header\b[^>]*>[\s\S]*?<\/header>/i, header).replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/i, footer);
}

async function readDir(relativePath) {
  try {
    return await fs.readdir(path.join(publicDir, relativePath), { withFileTypes: true });
  } catch {
    return [];
  }
}

function escapeAttr(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
