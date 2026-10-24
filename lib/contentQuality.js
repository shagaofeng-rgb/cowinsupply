const SITE_ORIGIN = "https://www.cowinsupply.com";

const PATH_ALIASES = new Map([
  ["/products", "/product"],
  ["/contact-us", "/contact"],
  ["/angle-grinders", "/products/angle-grinders"],
  ["/brushless-chainsaws", "/product"],
  ["/electric-wall-chasers", "/products/wall-chasers"],
  ["/products/electric-wall-chasers", "/products/wall-chasers"],
  ["/products/laser-rangefinder", "/products/laser-distance-meters"],
  ["/measuring-tools", "/products/measuring-tools"],
  ["/high-precision-measuring-tools", "/products/measuring-tools"],
  ["/products/laser-rangefinders", "/products/laser-distance-meters"],
  ["/products/laser-tape-measures", "/products/laser-measuring-tapes"],
  ["/wall-chasers", "/products/wall-chasers"],
  ["/electric-wall-chaser-products", "/products/wall-chasers"],
  ["/products/brushless-chainsaws", "/product"],
  ["/industrial-tools", "/product"],
  ["/customization-services", "/contact#quote"]
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
  let raw = String(value || "").trim();
  if (/^mailto:[^?\s]+@cowinsupply\.com(?:\?.*)?$/i.test(raw)) return "mailto:info@cowinsupply.com";
  if (!raw || /^(?:mailto:|tel:|javascript:|data:|#)/i.test(raw)) return raw;

  // Some imported articles contain a Markdown link as the entire href.
  // Resolve only the link target; keep unrelated external URLs untouched.
  if (/^(?:%5b|\[)/i.test(raw)) {
    try {
      const markdown = decodeURIComponent(raw).match(/^\[[^\]]+\]\(([^)]+)\)$/);
      if (markdown) raw = markdown[1].trim();
    } catch {
      // Preserve malformed encodings as-is.
    }
  }
  if (raw.toLowerCase() === "info@cowinsupply.com") return "mailto:info@cowinsupply.com";

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
