import { companyProfile } from "@/lib/companyProfile";
import { renderSiteFooter, renderSiteHeader, siteChromeCss } from "@/lib/siteChrome";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const success = new URL(request.url).searchParams.get("success") === "1";
  const title = success ? "Inquiry received | Cowin Supply" : "Inquiry status | Cowin Supply";
  const heading = success ? "Thank you. Your inquiry has been received." : "Your inquiry status";
  const copy = success
    ? "Our sales team has received your request. We will review the product, market and configuration details you provided before replying."
    : "Please return to the contact page and submit the required information again. If the issue continues, contact our sales team directly.";
  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="robots" content="noindex,follow"><style>${siteChromeCss()}*{box-sizing:border-box}body{margin:0;color:#17232d;font-family:Arial,'Segoe UI',sans-serif;background:#f7f9fb}.message-main{width:min(760px,calc(100% - 40px));min-height:calc(100vh - 76px);margin:0 auto;padding:92px 0}.message-panel{border:1px solid #d9e2ec;border-top:4px solid #e86018;background:#fff;padding:42px}.message-kicker{margin:0 0 12px;color:#c74d13;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.message-panel h1{max-width:620px;margin:0;color:#102a43;font-size:clamp(34px,6vw,52px);line-height:1.12}.message-panel p{max-width:620px;margin:18px 0 0;color:#486581;font-size:18px;line-height:1.7}.message-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}.message-actions a{display:inline-flex;min-height:46px;align-items:center;justify-content:center;padding:0 18px;border:1px solid #334e68;color:#102a43;font-weight:800;text-decoration:none}.message-actions a:first-child{border-color:#e86018;background:#e86018;color:#fff}@media(max-width:620px){.message-main{width:min(100% - 28px,760px);padding:48px 0}.message-panel{padding:30px 22px}.message-actions a{width:100%}}</style></head><body>${renderSiteHeader("")}<main class="message-main"><section class="message-panel"><p class="message-kicker">Cowin Supply inquiry</p><h1>${heading}</h1><p>${copy}</p><div class="message-actions"><a href="/product">View products</a><a href="/contact#quote">Send another inquiry</a><a href="${companyProfile.whatsAppUrl}" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></div></section></main>${renderSiteFooter()}<script src="/cowin-assets/site.js"></script></body></html>`;
  return new Response(body, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
