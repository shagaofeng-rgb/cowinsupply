import { renderSiteFooter, renderSiteHeader, siteChromeCss } from "@/lib/siteChrome";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.cowinsupply.com").replace(/\/$/, "");

export function renderBlogListHtml({ posts = [] }) {
  const cards = posts
    .map((post) => `<article class="blog-card">
      ${post.image ? `<a href="/blog/${escapeAttr(post.slug)}"><img src="${escapeAttr(post.image)}" alt="${escapeAttr(post.coverImageAlt || post.title)}" loading="lazy"></a>` : ""}
      <div><p class="eyebrow">${escapeHtml(post.category || "Cowin Supply Blog")}</p><h2><a href="/blog/${escapeAttr(post.slug)}">${escapeHtml(post.title)}</a></h2>
      <p>${escapeHtml(post.summary || post.seoDescription || "")}</p><p class="meta">${formatDate(post.publishedAt || post.createdAt)} · ${escapeHtml(post.authorName || "Cowin Supply")}</p></div>
    </article>`)
    .join("");
  return page({
    title: "Blog | Cowin Supply",
    description: "Practical sourcing, product and industrial supply insights from Cowin Supply.",
    canonical: `${SITE_URL}/blog`,
    body: `<main class="blog-shell"><section class="blog-hero"><p class="eyebrow">Knowledge center</p><h1>Cowin Supply Blog</h1><p>Practical product, sourcing and industrial supply guidance for global B2B buyers.</p></section><section class="blog-grid">${cards || emptyState()}</section></main>`
  });
}

export function renderBlogDetailHtml({ post, relatedPosts = [] }) {
  const related = relatedPosts
    .filter((item) => item.slug !== post.slug)
    .slice(0, 3)
    .map((item) => `<li><a href="/blog/${escapeAttr(item.slug)}">${escapeHtml(item.title)}</a></li>`)
    .join("");
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.summary || "",
    image: post.image ? [new URL(post.image, SITE_URL).toString()] : undefined,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt || post.publishedAt || post.createdAt,
    author: { "@type": "Organization", name: post.authorName || "Cowin Supply" },
    publisher: { "@type": "Organization", name: "Cowin Supply", url: SITE_URL },
    mainEntityOfPage: post.canonicalUrl || `${SITE_URL}/blog/${post.slug}`
  }).replace(/</g, "\\u003c");
  return page({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.summary || "",
    canonical: post.canonicalUrl || `${SITE_URL}/blog/${post.slug}`,
    image: post.image || "/cowin-assets/cowin-logo.png",
    structuredData: schema,
    body: `<main class="blog-shell"><nav class="breadcrumbs"><a href="/">Home</a><span>/</span><a href="/blog">Blog</a><span>/</span><span>${escapeHtml(post.title)}</span></nav>
      <article class="blog-article"><p class="eyebrow">${escapeHtml(post.category || "Cowin Supply Blog")}</p><h1>${escapeHtml(post.title)}</h1>
      <p class="lead">${escapeHtml(post.summary || post.seoDescription || "")}</p><p class="meta">Published ${formatDate(post.publishedAt || post.createdAt)} · ${escapeHtml(post.authorName || "Cowin Supply")}</p>
      ${post.image ? `<img class="article-cover" src="${escapeAttr(post.image)}" alt="${escapeAttr(post.coverImageAlt || post.title)}">` : ""}
      <section class="article-body">${sanitizeArticleHtml(post.content || `<p>${escapeHtml(post.summary || "")}</p>`)}</section>
      ${related ? `<section class="related"><h2>Related articles</h2><ul>${related}</ul></section>` : ""}</article></main>`
  });
}

function page({ title, description, canonical, image = "/cowin-assets/cowin-logo.png", structuredData = "", body }) {
  const absoluteImage = new URL(image, SITE_URL).toString();
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeAttr(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${escapeAttr(canonical)}"><meta property="og:type" content="article"><meta property="og:title" content="${escapeAttr(title)}"><meta property="og:description" content="${escapeAttr(description)}"><meta property="og:image" content="${escapeAttr(absoluteImage)}"><link rel="icon" href="/favicon.png" type="image/png"><link rel="stylesheet" href="/cowin-assets/site.css"><link rel="stylesheet" href="/cowin-assets/whatsapp-float.css"><style>${styles()}${siteChromeCss()}</style>${structuredData ? `<script type="application/ld+json">${structuredData}</script>` : ""}</head><body>${renderSiteHeader("/blog")}${body}${renderSiteFooter()}<a class="whatsapp-float" href="https://wa.me/message/L6JST5GV37UYI1" target="_blank" rel="noopener noreferrer" aria-label="Chat with Cowin Supply on WhatsApp" title="Chat on WhatsApp"><img src="/cowin-assets/whatsapp.svg" alt=""></a><script src="/cowin-assets/site.js"></script></body></html>`;
}

function styles() {
  return `*{box-sizing:border-box}body{margin:0;color:#243b53;background:#fff;font-family:Aptos,"Segoe UI",sans-serif;line-height:1.65}.site-header{min-height:74px;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:12px max(24px,calc((100vw - 1180px)/2));border-bottom:1px solid #d9e2ec;background:#fff}.brand{color:#102a43;font-weight:800;text-decoration:none}.site-header nav{display:flex;gap:22px;flex-wrap:wrap}.site-header nav a{color:#334e68;font-weight:700;text-decoration:none}.site-header nav a:hover,.blog-card a,.related a{color:#056889}.blog-shell{max-width:1080px;margin:0 auto;padding:52px 20px 76px}.blog-hero{max-width:760px;margin-bottom:34px}.eyebrow{margin:0 0 8px;color:#056889;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.blog-hero h1,.blog-article h1{margin:0;color:#102a43;font-size:clamp(36px,5vw,62px);line-height:1.08}.blog-hero p{font-size:19px;color:#486581}.blog-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.blog-card{overflow:hidden;border:1px solid #d9e2ec;border-radius:8px;background:#fff;box-shadow:0 1px 2px rgba(16,42,67,.04)}.blog-card img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}.blog-card>div{padding:20px}.blog-card h2{margin:5px 0 10px;color:#102a43;font-size:25px;line-height:1.24}.blog-card h2 a{color:inherit;text-decoration:none}.meta{color:#627d98;font-size:14px}.breadcrumbs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px;color:#627d98;font-size:14px}.breadcrumbs a{color:#056889}.blog-article{max-width:800px}.lead{color:#486581;font-size:20px}.article-cover{display:block;width:100%;margin:26px 0;border-radius:8px;aspect-ratio:16/9;object-fit:cover}.article-body{font-size:18px}.article-body h2,.article-body h3{color:#102a43;margin-top:32px}.article-body img{max-width:100%;height:auto}.article-body a{color:#056889}.related{margin-top:42px;padding-top:24px;border-top:1px solid #d9e2ec}.site-footer{padding:32px max(24px,calc((100vw - 1180px)/2));background:#102a43;color:#d9e2ec}.whatsapp-float{position:fixed;right:24px;top:50%;display:grid;place-items:center;width:58px;height:58px;border-radius:50%;background:#25d366;box-shadow:0 10px 24px rgba(16,42,67,.25);transform:translateY(-50%);z-index:9}.whatsapp-float img{width:31px}@media(max-width:680px){.site-header{align-items:flex-start;flex-direction:column}.blog-shell{padding:34px 16px 56px}.blog-grid{grid-template-columns:1fr}.whatsapp-float{right:16px}}`;
}

function sanitizeArticleHtml(value) {
  return String(value || "")
    .replace(/<\/?(script|style|iframe|object|embed|form)[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*(["']).*?\1/gi, "")
    .replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, "")
    .replace(/javascript:/gi, "");
}

function emptyState() { return `<div class="blog-card"><div><h2>No published Blog articles yet</h2><p>New editorial guides will appear here after review.</p></div></div>`; }
function formatDate(value) { try { return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(value)); } catch { return value || "Not dated"; } }
function escapeHtml(value) { return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
function escapeAttr(value) { return escapeHtml(value).replaceAll('"', "&quot;"); }
