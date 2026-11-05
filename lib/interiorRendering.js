import { companyProfile } from "@/lib/companyProfile";
import { normalizeCompanyText } from "@/lib/brandText";
import { normalizeCowinArticleLinks } from "@/lib/contentQuality";
import { renderSiteFooter, renderSiteHeader } from "@/lib/siteChrome";
import { inquiryTrackingScript } from "@/lib/staticHtml";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.cowinsupply.com").replace(/\/$/, "");
export const MAP_URL = "https://maps.app.goo.gl/P1YyVHoCdGBd9ef37";

export function escapeHtml(value) {
  return normalizeCompanyText(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

export function icon(name) {
  return `<svg class="cw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/cowin-assets/interior-icons.svg#${name}"></use></svg>`;
}

export function breadcrumbs(items) {
  const links = [["Home", "/"], ...items];
  return `<nav class="cw-crumb" aria-label="Breadcrumb"><ol>${links.map(([label, href]) => `<li>${href ? `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>` : `<span aria-current="page">${escapeHtml(label)}</span>`}</li>`).join("")}</ol></nav>`;
}

export function kicker(text) {
  return `<p class="cw-kicker">${escapeHtml(text)}</p>`;
}

export function button(text, href, { secondary = false, external = false, graphic = "" } = {}) {
  const symbol = graphic ? icon(graphic) : "";
  return `<a class="cw-button${secondary ? " cw-button-secondary" : ""}" href="${escapeHtml(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${graphic === "arrow-right" ? "" : symbol}${escapeHtml(text)}${graphic === "arrow-right" ? symbol : ""}</a>`;
}

export function whatsappButton(text = "WhatsApp sales") {
  return button(text, companyProfile.whatsAppUrl, { secondary: true, external: true, graphic: "brand-whatsapp" });
}

export function assetUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const raw = value.trim();
    const parsed = new URL(raw, SITE_URL);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return "";
    return raw.startsWith("/") && !raw.startsWith("//") && parsed.origin === new URL(SITE_URL).origin
      ? parsed.pathname + parsed.search
      : /^https:\/\//i.test(raw) ? parsed.href : "";
  } catch {
    return "";
  }
}

export function media(src, alt, { className = "", eager = false, priority = eager, product = false, fallback = "Image unavailable", fallbackIcon = product ? "blade" : "news" } = {}) {
  const url = assetUrl(src);
  return `<div class="cw-media ${className}${product ? " cw-media-product" : ""}"${url ? "" : ' data-media-missing'}>${url ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async"${priority ? ' fetchpriority="high"' : ""}>` : ""}<div class="cw-media-fallback">${icon(fallbackIcon)}<span>${escapeHtml(fallback)}</span></div></div>`;
}

export function interiorPage({ title, description = "", canonical, robots = "index,follow,max-image-preview:large", image, type = "website", schema, active = "", compactFooter = false, body }) {
  const shareImage = assetUrl(image);
  const structured = schema ? `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>` : "";
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="${escapeHtml(robots)}">
${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}"><meta property="og:url" content="${escapeHtml(canonical)}">` : ""}
<meta property="og:type" content="${type}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}">
${shareImage ? `<meta property="og:image" content="${escapeHtml(new URL(shareImage, SITE_URL).href)}">` : ""}
<link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/cowin-assets/interiors.css">
<script defer src="/cowin-assets/interiors.js"></script>${structured}
</head><body class="interior">${interiorChrome(body, active, compactFooter)}${inquiryTrackingScript()}</body></html>`;
}

export function interiorChrome(body, active = "", compactFooter = false) {
  const header = renderSiteHeader(active)
    .replace('aria-controls="cowin-products">Products ▾', `aria-controls="cowin-products"${active === "/product" ? ' class="cw-current"' : ""}>Products ${icon("chevron-down")}`)
    .replace('>Contact</a></nav>', '>Contact</a><a class="cw-mobile-quote-link" href="/contact#quote">Request Quote</a></nav>')
    .replace(">Menu</button>", `>${icon("menu-2")}</button>`);
  const footer = compactFooter
    ? `<footer class="cowin-footer cw-compact-footer"><div class="cw-wrap"><a class="cw-wordmark" href="/" aria-label="Cowin Supply home">COWIN</a><a href="mailto:${escapeHtml(companyProfile.email)}">${escapeHtml(companyProfile.email)}</a></div></footer>`
    : renderSiteFooter();
  return `<a class="cw-skip" href="#main-content">Skip to content</a>${header}${body.replace('id="main-content"', 'id="main-content" tabindex="-1"')}${footer}`;
}

export function htmlResponse(body, headers = {}) {
  return new Response(body, { headers: { "content-type": "text/html; charset=utf-8", ...headers } });
}

export function textLink(label, href) {
  return `<a class="cw-text-link" href="${escapeHtml(href)}">${escapeHtml(label)} ${icon("arrow-right")}</a>`;
}

export function pageHeading(eyebrow, heading, description) {
  return `<div class="cw-page-heading">${kicker(eyebrow)}<h1>${escapeHtml(heading)}</h1>${description ? `<p class="cw-lead">${escapeHtml(description)}</p>` : ""}</div>`;
}

export function paginationNav({ page, totalPages, href }) {
  if (totalPages < 2) return "";
  return `<nav class="cw-pagination" aria-label="Pagination">
    ${page > 1 ? button("Previous", href(page - 1), { secondary: true }) : ""}
    <span aria-current="page">Page ${page} of ${totalPages}</span>
    ${page < totalPages ? button("Next", href(page + 1), { secondary: true, graphic: "arrow-right" }) : ""}
  </nav>`;
}

function formField(label, name, { type = "text", max, autocomplete, required = false } = {}) {
  return `<label>${label}${required ? ' <span class="cw-required" aria-hidden="true">*</span>' : ""}<input name="${name}" type="${type}"${max ? ` maxlength="${max}"` : ""}${autocomplete ? ` autocomplete="${autocomplete}"` : ""}${required ? " required" : ""}></label>`;
}

export function inquiryForm(product, pageUrl) {
  return `<form class="cw-form" method="post" action="/api/inquiry" data-inquiry-confirmation>
    ${product ? `<input type="hidden" name="product" value="${escapeHtml(product.title)}"><input type="hidden" name="productModel" value="${escapeHtml(product.model)}"><input type="hidden" name="pageUrl" value="${escapeHtml(pageUrl)}"><input type="hidden" name="source" value="product-detail">` : ""}
    <div hidden><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
    ${formField("Name", "name", { max: 120, autocomplete: "name", required: true })}
    ${formField(product ? "Business email" : "Email", "email", { type: "email", max: 160, autocomplete: "email", required: true })}
    ${formField("Company", "company", { max: 160, autocomplete: "organization" })}
    ${product ? formField("Country / region", "country", { max: 120, autocomplete: "country-name" }) : ""}
    ${formField(product ? "WhatsApp / phone" : "Phone", "phone", { type: "tel", max: 60, autocomplete: "tel" })}
    ${product ? `<label>Buyer type<select name="buyerType"><option value="">Select buyer type</option><option>Distributor</option><option>Wholesaler</option><option>Contractor</option><option>Retailer</option><option>Professional end user</option></select></label>
    ${formField("Estimated quantity", "estimatedQuantity", { max: 120 })}
    ${formField("Required voltage / specification", "requiredSpecification", { max: 240 })}` : ""}
    <label class="cw-form-wide">${product ? "Message" : "Products / quantity"} <span class="cw-required" aria-hidden="true">*</span>
      <textarea name="message" maxlength="4000" placeholder="${product ? "Application, material and configuration requirements" : "Model or application, quantity and target market"}" required></textarea>
    </label>
    <p class="inquiry-feedback cw-form-wide" role="status" aria-live="polite" aria-atomic="true"></p>
    <div class="cw-form-actions cw-form-wide"><button type="submit" class="cw-button"><span data-submit-label>Submit inquiry</span>${icon("arrow-right")}</button><small><span class="cw-required" aria-hidden="true">*</span> Required fields</small></div>
  </form>`;
}

export function dateText(value) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.valueOf())
    ? new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "2-digit", timeZone: "UTC" }).format(date)
    : "";
}

export function articleContent(html, { removeMedia = false, mapHref = href => href, allowImage = () => true } = {}) {
  const blocked = "script|style|iframe|object|embed|form|template|svg|math|noscript|textarea";
  const blocks = new RegExp(`<(${blocked})\\b[^>]*>[\\s\\S]*?<\\/\\1\\s*>`, "gi");
  const allowed = new Set("a abbr b blockquote br caption cite code dd del div dl dt em figcaption figure h2 h3 h4 h5 h6 hr i img li ol p pre q s small span strong sub sup table tbody td th thead tfoot tr u ul".split(" "));
  const voids = new Set(["br", "hr", "img"]);
  let input = normalizeCowinArticleLinks(normalizeCompanyText(html)).replace(/<!--[\s\S]*?-->/g, "").replace(blocks, "");
  if (removeMedia) input = input.replace(/<figure\b[\s\S]*?<\/figure>/gi, "");
  let cleaned = input.replace(/<(\/?)([a-z][a-z0-9-]*)(\s+(?:"[^"]*"|'[^']*'|[^"'<>])*?)?\s*\/?>|</gi, (tag, closing, rawName, attributes = "") => {
    if (tag === "<") return "&lt;";
    const name = rawName.toLowerCase() === "h1" ? "h2" : rawName.toLowerCase();
    if (!allowed.has(name) || (removeMedia && name === "img")) return "";
    if (closing) return voids.has(name) ? "" : `</${name}>`;
    const values = new Map();
    for (const part of attributes.matchAll(/([a-z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
      const key = part[1].toLowerCase();
      if (!values.has(key)) values.set(key, (part[2] ?? part[3] ?? part[4]).replace(/&amp;/gi, "&"));
    }
    const get = key => values.get(key)?.trim() || "";
    const id = get("id");
    const safe = /^[a-z][\w-]*$/i.test(id) ? ` id="${escapeHtml(id)}"` : "";
    if (name === "a") {
      const href = mapHref(get("href"));
      return /^(?:https?:\/\/|mailto:|tel:|#|\/(?![/\\]))/i.test(href) && !/[\u0000-\u001f\u007f]/.test(href)
        ? `<a${safe} href="${escapeHtml(href)}">` : `<a${safe}>`;
    }
    if (name === "img") {
      const src = assetUrl(get("src"));
      return src && allowImage(src) ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(get("alt"))}" loading="lazy" decoding="async">` : "";
    }
    if (name === "td" || name === "th") {
      const spans = ["colspan", "rowspan"].filter(key => /^[1-9]\d?$/.test(get(key))).map(key => ` ${key}="${get(key)}"`).join("");
      const scope = name === "th" && /^(?:row|col|rowgroup|colgroup)$/.test(get("scope")) ? ` scope="${get("scope")}"` : "";
      return `<${name}${safe}${spans}${scope}>`;
    }
    if (name === "ol" && /^\d{1,4}$/.test(get("start"))) return `<ol${safe} start="${get("start")}">`;
    return `<${name}${safe}>`;
  });
  cleaned = cleaned.replace(/<figure>\s*<\/figure>/g, "")
    .replace(/<table\b/g, '<div class="cw-table-scroll" tabindex="0" role="region" aria-label="Article table"><table').replace(/<\/table>/g, "</table></div>");
  const headings = [];
  const ids = new Set();
  let number = 0;
  cleaned = cleaned.replace(/<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/gi, (tag, level, attrs, labelHtml) => {
    const label = labelHtml.replace(/<[^>]*>/g, "").replace(/&(?:amp|nbsp);/g, value => value === "&amp;" ? "&" : " ").trim();
    if (!label) return tag;
    const existing = attrs.match(/\bid\s*=\s*["']([a-z][\w-]*)["']/i)?.[1];
    let id = existing;
    while (!id || ids.has(id)) id = `cw-section-${++number}`;
    ids.add(id);
    headings.push([label, id, level]);
    return `<h${level}${attrs.replace(/\s+id\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i, "")} id="${escapeHtml(id)}">${labelHtml}</h${level}>`;
  });
  return { html: cleaned, headings };
}

export function articleDate(value) {
  const label = dateText(value);
  return label ? `<time datetime="${escapeHtml(new Date(value).toISOString())}">${escapeHtml(label)}</time>` : "";
}

export function articleLayout({ label, title, summary, byline, cover, content, headings, aside = "", after = "", tocTitle = "In this article" }) {
  const toc = articleToc(headings, tocTitle);
  return `<article class="cw-article-layout">
    <header class="cw-article-header">${kicker(label)}<h1>${escapeHtml(title)}</h1>${summary ? `<p class="cw-lead">${escapeHtml(summary)}</p>` : ""}<p class="cw-byline">${byline}</p></header>
    ${toc ? `<div class="cw-mobile-toc">${toc}</div>` : ""}
    <div class="cw-article-main">${cover}<div class="cw-article-body">${content}</div>${after}</div>
    ${toc || aside ? `<aside class="cw-article-aside" aria-label="Article navigation">${toc ? `<div class="cw-desktop-toc">${toc}</div>` : ""}${aside}</aside>` : ""}
  </article>`;
}

export function articleToc(headings, label) {
  const sections = headings.filter(([, , level]) => level === "2");
  const items = sections.length >= 2 ? sections : headings;
  if (items.length < 2) return "";
  const links = items.map(([title, id]) => `<li><a href="#${escapeHtml(id)}">${escapeHtml(title)}${icon("arrow-right")}</a></li>`).join("");
  return `<details class="cw-toc" data-collapsible-wide open><summary>${escapeHtml(label)}${icon("chevron-down")}</summary><ol>${links}</ol></details>`;
}

export function notFoundContent() {
  return `<main class="cw-wrap cw-status cw-not-found" id="main-content"><div>
    <div class="cw-status-icon">${icon("compass")}${kicker("404")}</div>
    <h1>Page not found</h1><p class="cw-lead">This address may have changed. Browse the product catalog or contact our team for help.</p>
    <div class="cw-actions">${button("Browse products", "/product", { graphic: "arrow-right" })}${button("Contact sales", "/contact#quote", { secondary: true })}</div>
    <nav class="cw-status-links" aria-label="More pages"><a href="/news">News</a><a href="/blog">Blog</a></nav>
  </div></main>`;
}

export function notFoundResponse() {
  return new Response(interiorPage({ title: "Page not found | Cowin Supply", robots: "noindex,follow", compactFooter: true, body: notFoundContent() }), {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8" }
  });
}
