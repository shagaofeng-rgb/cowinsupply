const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.cowinsupply.com").replace(/\/$/, "");

export async function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /api/",
    "Disallow: /tag/",
    "Disallow: /message/",
    `Sitemap: ${SITE_URL}/sitemap.xml`
  ].join("\n");
  return new Response(`${body}\n`, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "s-maxage=3600" } });
}
