import fs from "node:fs/promises";
import path from "node:path";
import { getCmsItems } from "@/lib/cmsStore";
import { companyProfile } from "@/lib/companyProfile";
import { normalizeCompanyText } from "@/lib/brandText";
import { renderSiteFooter, renderSiteHeader } from "@/lib/siteChrome";

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
    return new Response(injectTracking(injectSeo(injectCompanyProfile(withRelatedNews, relativePath), canonicalPath)), { headers: HTML_HEADERS });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

function injectCompanyProfile(html, relativePath) {
  const activePath = relativePath.startsWith("about") ? "/about" : relativePath.startsWith("contact") ? "/contact" : "";
  let next = normalizeCompanyText(html)
    .replace(/<header class="site-header">[\s\S]*?<\/header>/i, renderSiteHeader(activePath))
    .replace(/<footer class="site-footer">[\s\S]*?<\/footer>/i, renderSiteFooter())
    .replace(/https:\/\/wa\.me\/message\/[^"']+/gi, companyProfile.whatsAppUrl)
    .replace(/tel:\+?\d+/gi, companyProfile.phoneHref)
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

export function inquiryTrackingScript() {
  return `<script>
(function(){
  try {
    var visitorKey = "cowinsupply_visitor_id";
    var sessionKey = "cowinsupply_session_id";
    var landingKey = "cowinsupply_landing_page";
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
    var params = new URLSearchParams(location.search);
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
