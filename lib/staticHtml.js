import fs from "node:fs/promises";
import path from "node:path";
import { getCmsCollections, getStorefrontCollections } from "@/lib/cmsStore";
import { isCanonicalProductRecord } from "@/lib/catalogTaxonomy";
import { companyProfile } from "@/lib/companyProfile";
import { normalizeCompanyText } from "@/lib/brandText";
import { renderSiteFooter, renderSiteHeader } from "@/lib/siteChrome";
import { uniqueNews } from "@/lib/newsDuplicates";
import { storefrontPicture } from "@/lib/storefrontMedia";

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

  let html;
  try {
    html = await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT" || error?.code === "ENOTDIR") return new Response("Not found", { status: 404 });
  }
  try {
    if (typeof html !== "string") throw new Error("Static page unavailable");
    const isHome = relativePath === "index.html";
    const started = performance.now();
    const homeCatalog = isHome ? await getStorefrontCollections({ includeNews: true }) : null;
    const catalogTiming = isHome ? `catalog;dur=${Math.round(performance.now() - started)}` : null;
    const withRelatedNews = await injectRelatedNews(homeCatalog ? injectHomepageCatalog(html, homeCatalog) : html, relativePath);
    return new Response(injectTracking(injectSeo(normalizeInternalLinks(injectCompanyProfile(withRelatedNews, relativePath)), canonicalPath)), {
      headers: {
        ...HTML_HEADERS,
        ...(isHome ? {
          "Vercel-CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=60",
          "Server-Timing": catalogTiming
        } : {})
      }
    });
  } catch (error) {
    console.error("[public-html] Unable to render page:", relativePath, error?.code || error?.name || "unknown-error");
    return new Response("Page temporarily unavailable. Please try again shortly.", {
      status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "60" }
    });
  }
}

function normalizeInternalLinks(html) {
  const routes = {
    "index.html": "/",
    "product/index.html": "/product",
    "news/index.html": "/news",
    "blog/index.html": "/blog",
    "about/index.html": "/about",
    "contact/index.html": "/contact",
    "message/index.html": "/message"
  };
  return String(html).replace(/href=(["'])(?:\.\.\/|\.\/)?(index\.html|product\/index\.html|news\/index\.html|blog\/index\.html|about\/index\.html|contact\/index\.html|message\/index\.html)(?:#[^"']*)?\1/gi, (_match, quote, target) => `href=${quote}${routes[target.toLowerCase()] || "/"}${quote}`);
}

function injectHomepageCatalog(html, { product: products, news }) {
  const available = products.filter(isCanonicalProductRecord);
  const categorySizes = "(max-width: 720px) calc(100vw - 32px), (max-width: 1050px) 31vw, 228px";
  const productSizes = "(max-width: 520px) calc(100vw - 32px), (max-width: 900px) 46vw, 330px";
  const picture = (url, alt, sizes) => storefrontPicture(url, `<img src="${escapeAttr(url)}" alt="${escapeAttr(alt)}" loading="lazy" decoding="async" fetchpriority="low">`, sizes);
  const categoryExamples = { "cutting-tools": "KFT-Q450BrushlessJigSaw", "drilling-tools": "ACBrushlesswaterdrillingrig", "surface-finishing-tools": "ACBrushlesswallpolishingmachine", "wall-chasers": "6000wsolttingmachine", "measuring-tools": "LaserMeasuringDevicwithMultiFunction", "precision-tools": "ScrewdriverforElectronics" };
  let next = html.replace(/<article class="home-category-card">[\s\S]*?<\/article>/g, card => {
    const category = card.match(/href="\/products\/([^"/]+)"/)?.[1];
    const product = available.find(item => item.slug === categoryExamples[category]);
    return product?.image ? card.replace(/<img\b[^>]+>/, () => picture(product.image, product.title, categorySizes)) : card;
  });
  next = next.replace(/<article class="home-product-card">[\s\S]*?<\/article>/g, (card) => {
    const slug = card.match(/href="\/product\/([^"/]+)\.html"/)?.[1];
    const product = available.find(item => item.slug === slug);
    if (!product) return "";
    const url = `/product/${escapeAttr(product.slug)}.html`;
    return `<article class="home-product-card"><a class="home-product-media" href="${url}">${picture(product.image, product.title, productSizes)}</a><div class="home-product-copy"><h3>${escapeHtml(product.title)}</h3><p>${escapeHtml(product.summary || "Contact us for current specifications and wholesale pricing.")}</p><a class="home-link" href="${url}">View Details</a></div></article>`;
  });
  const recent = uniqueNews(news.filter(item => item.status === "published")).slice(0, 3);
  let index = 0;
  next = next.replace(/<article class="home-news-card">[\s\S]*?<\/article>/g, () => {
    const item = recent[index++];
    if (!item) return "";
    return `<article class="home-news-card">${picture(item.image || item.coverImage || '/cowin-assets/scene-news-sparks.jpg', item.title, "(max-width: 720px) calc(100vw - 32px), 440px")}<div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary || '')}</p><a class="home-link" href="/news/${escapeAttr(item.slug)}">Read More</a></div></article>`;
  });
  if (!recent.length) next = next.replace(/<div class="home-news-grid"><\/div>/, '<div class="home-news-grid"><p>No published news is available yet.</p></div>');
  return next;
}

function injectCompanyProfile(html, relativePath) {
  const activePath = relativePath.startsWith("about") ? "/about" : relativePath.startsWith("contact") ? "/contact" : "";
  const isHome = relativePath === "index.html";
  let next = normalizeCompanyText(html)
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/i, `${isHome ? '<a class="cowin-skip" href="#main-content">Skip to content</a>' : ""}${renderSiteHeader(activePath, { stylesInHead: isHome })}`)
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/i, renderSiteFooter())
    .replace(/https:\/\/wa\.me\/message\/[^"']+/gi, companyProfile.whatsAppUrl)
    .replace(/tel:\+?\d+/gi, companyProfile.whatsAppUrl)
    .replace(/\+8617601255205/g, companyProfile.phone)
    .replace(/davidsha@cowinsupply\.com/gi, companyProfile.email);

  if (companyProfile.addressStatus !== "confirmed") {
    next = next.replace(/<div class="contact-item"><strong>Address<\/strong>[\s\S]*?<\/div>/i, "");
    next = next.replace(/<p class="lead">The official contact address is[\s\S]*?<\/p>/i, "");
  }
  return next;
}

async function injectRelatedNews(html, relativePath) {
  const match = String(relativePath).match(/^product\/([^/]+?)(?:\.html)?$/i);
  if (!match) return html;

  const slug = match[1].replace(/\.html$/i, "");
  const { product: products, news } = await getCmsCollections(["product", "news"]);
  const product = products.filter(isCanonicalProductRecord).find((item) => item.slug === slug);
  if (!product) return html;

  const related = uniqueNews(news)
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

function escapeHtml(value) { return escapeAttr(value); }

export function inquiryTrackingScript() {
  return `<script>
(function(){
  try {
    var visitorKey = "cowinsupply_visitor_id";
    var sessionKey = "cowinsupply_session_id";
    var landingKey = "cowinsupply_landing_page";
    var landingReferrerKey = "cowinsupply_landing_referrer";
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
    var landingPage = sessionStorage.getItem(landingKey);
    if (!landingPage) {
      landingPage = location.href;
      sessionStorage.setItem(landingKey, landingPage);
    }
    var landingReferrer = sessionStorage.getItem(landingReferrerKey);
    if (landingReferrer === null) {
      landingReferrer = document.referrer || "";
      sessionStorage.setItem(landingReferrerKey, landingReferrer);
    }
    var params = new URL(landingPage, location.href).searchParams;
    var context = {
      visitorId: visitorId, sessionId: sessionId, landingPage: landingPage,
      pageUrl: location.href, pageTitle: document.title, referrer: document.referrer,
      utmSource: params.get("utm_source") || "", utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "", utmTerm: params.get("utm_term") || "",
      utmContent: params.get("utm_content") || "", browserLanguage: navigator.language || "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "", screen: screen.width + "x" + screen.height
    };
    var payload = JSON.stringify({
      path: location.pathname, title: document.title, referrer: document.referrer,
      initialReferrer: landingReferrer, utmSource: context.utmSource,
      utmMedium: context.utmMedium, utmCampaign: context.utmCampaign,
      language: navigator.language, screen: context.screen, visitorId: visitorId, sessionId: sessionId
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true });
    }
    document.querySelectorAll('form[action="/api/inquiry"]').forEach(function(form){
      Object.keys(context).forEach(function(name){
        var field = form.querySelector('[name="' + name + '"]');
        if (!field) { field = document.createElement("input"); field.type = "hidden"; field.name = name; form.appendChild(field); }
        field.value = context[name];
      });
      form.addEventListener("submit", function(event){
        if (form.dataset.submitting === "true") {
          event.preventDefault();
          return;
        }
        if (!form.checkValidity()) return;
        form.dataset.submitting = "true";
        var submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.setAttribute("aria-busy", "true");
          submitButton.textContent = "Sending inquiry...";
        }
      });
    });
  } catch (error) {}
})();
</script>`;
}

function injectTracking(html) {
  if (html.includes("/api/track")) return html;
  const script = inquiryTrackingScript();
  return html.includes("</body>") ? html.replace("</body>", `${script}</body>`) : `${html}${script}`;
}
