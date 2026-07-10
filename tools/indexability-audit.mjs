const baseUrl = (process.argv[2] || "https://www.cowinsupply.com").replace(/\/$/, "");
const sitemapUrl = `${baseUrl}/sitemap.xml`;

const indexResponse = await fetch(sitemapUrl);
if (!indexResponse.ok) throw new Error(`Sitemap index returned ${indexResponse.status}`);
const indexXml = await indexResponse.text();
const childSitemaps = extractLocs(indexXml);
const childXml = await Promise.all(childSitemaps.map(async (url) => {
  const childUrl = new URL(new URL(url).pathname, `${baseUrl}/`).toString();
  const response = await fetch(childUrl);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}));
const urls = [...new Set(childXml.flatMap(extractLocs))];

const results = await mapWithConcurrency(urls, 8, async (url) => {
  try {
    const expectedCanonical = normalizeProductionUrl(url);
    const requestUrl = new URL(new URL(url).pathname + new URL(url).search, `${baseUrl}/`).toString();
    const response = await fetch(requestUrl, { redirect: "follow" });
    const html = await response.text();
    const canonical = readMeta(html, "canonical");
    const robots = readMeta(html, "robots");
    const issues = [];
    if (response.status !== 200) issues.push(`HTTP ${response.status}`);
    if (normalizePath(response.url) !== normalizePath(requestUrl)) issues.push(`redirected to ${response.url}`);
    if (/noindex/i.test(robots)) issues.push(`robots=${robots}`);
    if (!canonical) issues.push("missing canonical");
    if (canonical && normalizeProductionUrl(canonical) !== expectedCanonical) issues.push(`canonical=${canonical}`);
    return { url, status: response.status, finalUrl: response.url, canonical, robots, issues };
  } catch (error) {
    return { url, status: 0, finalUrl: "", canonical: "", robots: "", issues: [String(error?.message || error)] };
  }
});

const problems = results.filter((result) => result.issues.length);
console.log(JSON.stringify({ baseUrl, sitemapUrl, totalUrls: urls.length, passed: urls.length - problems.length, failed: problems.length, problems }, null, 2));
if (problems.length) process.exitCode = 1;

function extractLocs(xml) {
  return [...String(xml).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decodeXml(match[1]));
}

function readMeta(html, type) {
  if (type === "canonical") {
    return html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1]
      || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1]
      || "";
  }
  return html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)/i)?.[1]
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["']/i)?.[1]
    || "";
}

function normalizeProductionUrl(value) {
  const url = new URL(value, "https://www.cowinsupply.com");
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/$/, "");
  url.hash = "";
  return url.toString();
}

function normalizePath(value) {
  const url = new URL(value);
  return url.pathname === "/" ? "/" : url.pathname.replace(/\/$/, "");
}

function decodeXml(value) {
  return String(value).replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&apos;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">");
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}
