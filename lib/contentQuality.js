const SITE_ORIGIN = "https://www.cowinsupply.com";

const PATH_ALIASES = new Map([
  ["/products", "/product"],
  ["/contact-us", "/contact"],
  ["/angle-grinders", "/products/angle-grinders"],
  ["/brushless-chainsaws", "/product"],
  ["/electric-wall-chasers", "/products/wall-chasers"],
  ["/products/electric-wall-chasers", "/products/wall-chasers"],
  ["/products/laser-rangefinder", "/products/laser-distance-meters"]
]);

export function compactText(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!maxLength || text.length <= maxLength) return text;
  const raw = text.slice(0, Math.max(1, maxLength - 1));
  const boundary = raw.lastIndexOf(" ");
  const safe = boundary >= Math.floor(maxLength * 0.65) ? raw.slice(0, boundary) : raw;
  return `${safe.replace(/[,:;\-\s]+$/g, "")}…`;
}

export function seoTitleFor(title, maxLength = 70) {
  const suffix = " | Cowin Supply";
  return `${compactText(title, maxLength - suffix.length)}${suffix}`;
}

export function normalizeCowinInternalHref(value) {
  const raw = String(value || "").trim();
  if (!raw || /^(?:mailto:|tel:|javascript:|data:|#)/i.test(raw)) return raw;

  const hosted = raw.match(/^(?:https?:\/\/|\/)?(?:www\.)?cowinsupply\.com(?=\/|$)([\s\S]*)/i);
  const internal = hosted ? hosted[1] || "/" : raw.startsWith("/") ? raw : "";
  if (!internal) return raw;

  try {
    const url = new URL(internal, SITE_ORIGIN);
    const pathname = PATH_ALIASES.get(url.pathname.replace(/\/$/, "") || "/") || url.pathname;
    return `${pathname}${url.search}${url.hash}`;
  } catch {
    return raw;
  }
}

export function normalizeCowinArticleLinks(html) {
  return String(html || "").replace(/\bhref\s*=\s*(["'])([^"']*)\1/gi, (_match, quote, href) => {
    return `href=${quote}${normalizeCowinInternalHref(href)}${quote}`;
  });
}
