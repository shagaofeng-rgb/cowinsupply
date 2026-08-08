import { companyProfile } from "@/lib/companyProfile";

const NAV_ITEMS = [
  ["/product", "Products"],
  ["/news", "News"],
  ["/blog", "Blog"],
  ["/about", "About"],
  ["/contact", "Contact"]
];

export function renderSiteHeader(activePath = "") {
  const links = NAV_ITEMS.map(([href, label]) => {
    const active = activePath === href ? ' class="is-active" aria-current="page"' : "";
    return `<a href="${href}"${active}>${label}</a>`;
  }).join("");

  return `<header class="site-header"><div class="container nav-wrap"><a class="brand" href="/"><img src="/cowin-assets/cowin-logo.png" alt="${companyProfile.brandName} logo"><span>${companyProfile.brandName}</span></a><nav class="main-nav" aria-label="Main navigation">${links}</nav><a class="btn btn-dark header-cta" href="/contact#quote">Get Wholesale Price</a><button class="nav-toggle" type="button" aria-label="Open navigation" aria-expanded="false"><span></span><span></span><span></span></button></div></header>`;
}

export function renderSiteFooter() {
  const address = companyProfile.addressStatus === "confirmed" ? `<br>${companyProfile.address}` : "";
  return `<footer class="site-footer"><div class="container footer-grid"><div><h3>${companyProfile.brandName}</h3><p>${companyProfile.legalName}${address}</p></div><div><h3>Products</h3><a href="/product">All Products</a><a href="/products/wall-chasers">Wall Chasers</a><a href="/products/measuring-tools">Measuring Tools</a></div><div><h3>Resources</h3><a href="/news">News</a><a href="/blog">Blog</a><a href="/about">About</a><a href="/contact">Contact</a></div><div><h3>Contact</h3><a href="${companyProfile.phoneHref}">${companyProfile.phone}</a><a href="mailto:${companyProfile.email}">${companyProfile.email}</a></div></div><div class="footer-bottom"><div class="container">Copyright 2026 ${companyProfile.brandName}. All rights reserved.</div></div></footer>`;
}

export function siteChromeCss() {
  return `.site-header{position:sticky;top:0;z-index:20;display:block;min-height:0;padding:0;background:rgba(255,255,255,.96);border-bottom:1px solid #e4e7eb;box-shadow:none;backdrop-filter:blur(12px)}.site-header .nav-wrap{width:min(1180px,calc(100% - 48px));min-height:76px;margin:0 auto;display:flex;align-items:center;gap:24px}.site-header .brand{display:inline-flex;align-items:center;gap:10px;color:#0b1720;font-size:19px;font-weight:900;text-decoration:none}.site-header .brand img{width:42px;height:42px;object-fit:contain}.site-header .main-nav{display:flex;align-items:center;gap:26px;margin-left:auto}.site-header .main-nav a{color:#27313a;font-size:14px;font-weight:800;text-decoration:none}.site-header .main-nav a:hover,.site-header .main-nav a.is-active{color:#ff6410}.site-header .header-cta{width:auto;min-height:46px;color:#fff}.site-header .nav-toggle{display:none}.site-footer{display:block;padding:56px 0 0;background:#071018;color:#d7dde4}.site-footer .footer-grid{width:min(1180px,calc(100% - 48px));margin:0 auto;display:grid;grid-template-columns:1.4fr repeat(3,1fr);gap:32px}.site-footer h3{margin:0;color:#fff;font-size:18px}.site-footer p{color:#b9c3cd}.site-footer a{display:block;margin-top:10px;color:#b9c3cd;text-decoration:none}.site-footer .footer-bottom{margin-top:36px;padding:18px 0;border-top:1px solid rgba(255,255,255,.12);color:#98a5b2}.site-footer .footer-bottom .container{width:min(1180px,calc(100% - 48px));margin:0 auto}@media(max-width:980px){.site-header .main-nav,.site-header .header-cta{display:none}.site-header .nav-toggle{display:block;margin-left:auto}.nav-open .site-header .main-nav{position:absolute;top:76px;left:0;right:0;display:flex;flex-direction:column;align-items:stretch;gap:0;padding:10px 24px 20px;background:#fff;border-bottom:1px solid #e4e7eb}.nav-open .site-header .main-nav a{padding:14px 0;border-bottom:1px solid #e4e7eb}.site-footer .footer-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:620px){.site-header .nav-wrap,.site-footer .footer-grid,.site-footer .footer-bottom .container{width:min(100% - 28px,1180px)}.site-header .brand{font-size:17px}.site-header .brand img{width:40px;height:40px}.site-footer .footer-grid{grid-template-columns:1fr}}`;
}
