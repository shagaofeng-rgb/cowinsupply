const baseUrl = (process.argv[2] || "https://www.cowinsupply.com").replace(/\/$/, "");
const response = await fetch(`${baseUrl}/api/news`);
if (!response.ok) throw new Error(`News API returned ${response.status}`);

const payload = await response.json();
const news = payload?.data?.items || [];
const results = await Promise.all(news.map((article) => inspectArticle(article.slug)));
const problems = results.flatMap((result) => result.problems);

console.log(JSON.stringify({ baseUrl, checked: results.length, failed: problems.length, problems }, null, 2));
if (problems.length) process.exitCode = 1;

async function inspectArticle(slug) {
  const url = `${baseUrl}/news/${encodeURIComponent(slug)}`;
  const page = await fetch(url);
  if (!page.ok) return { slug, problems: [{ url, issue: `HTTP ${page.status}` }] };

  const html = await page.text();
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const products = [];
  for (const script of scripts) {
    try {
      collectProducts(JSON.parse(script[1]), products);
    } catch {
      return { slug, problems: [{ url, issue: "Invalid JSON-LD" }] };
    }
  }

  return {
    slug,
    problems: products
      .filter((product) => !product.offers && !product.review && !product.aggregateRating)
      .map((product) => ({ url, issue: `Product schema without offers, review, or aggregateRating: ${product.name || "unnamed"}` }))
  };
}

function collectProducts(value, products) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectProducts(item, products));
    return;
  }
  if (!value || typeof value !== "object") return;
  const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
  if (types.includes("Product")) products.push(value);
  Object.values(value).forEach((item) => collectProducts(item, products));
}
