const fs = require("node:fs");
const path = require("node:path");

function cleanText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*[-|]\s*Cowin.*$/i, "");
}

function collectHtmlPages(dir, type, category, image) {
  const root = path.join(process.cwd(), "public", dir);
  return fs
    .readdirSync(root)
    .filter((name) => name.toLowerCase().endsWith(".html") && !name.startsWith("index"))
    .map((name) => {
      const html = fs.readFileSync(path.join(root, name), "utf8");
      const slug = path.basename(name, ".html");
      const title = cleanText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]) || slug;
      const summary =
        cleanText(html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)?.[1]) ||
        (type === "product" ? "Cowin Supply product page." : "Cowin Supply news page.");

      return {
        id: `${type}-${slug.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        type,
        slug,
        title,
        category,
        image,
        status: "published",
        summary,
        createdAt: "2026-07-07T00:00:00.000Z",
        updatedAt: "2026-07-08T00:00:00.000Z"
      };
    });
}

const filePath = path.join(process.cwd(), "data", "cmsFallback.json");
const existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
const byKey = new Map(existing.map((item) => [`${item.type}:${item.slug}`, item]));

for (const item of collectHtmlPages("product", "product", "Products", "/cowin-assets/product-jigsaw.webp")) {
  byKey.set(`${item.type}:${item.slug}`, { ...item, ...(byKey.get(`${item.type}:${item.slug}`) || {}) });
}

for (const item of collectHtmlPages("news", "news", "News", "/cowin-assets/scene-news-grinder.jpg")) {
  byKey.set(`${item.type}:${item.slug}`, { ...item, ...(byKey.get(`${item.type}:${item.slug}`) || {}) });
}

const items = [...byKey.values()].sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title));
fs.writeFileSync(filePath, `${JSON.stringify(items, null, 2)}\n`, "utf8");

console.log(
  `wrote ${items.length} cms fallback items (${items.filter((item) => item.type === "product").length} products, ${
    items.filter((item) => item.type === "news").length
  } news)`
);
