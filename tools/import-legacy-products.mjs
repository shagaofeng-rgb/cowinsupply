import fs from "node:fs/promises";
import path from "node:path";

if (process.env.ALLOW_LEGACY_PRODUCT_IMPORT !== "true") {
  throw new Error("Legacy product import is disabled. Set ALLOW_LEGACY_PRODUCT_IMPORT=true only for an approved, backed-up migration.");
}

const LEGACY_ORIGIN = "https://s8ozwsrp.fuwucms.com";
const OUTPUT = path.join(process.cwd(), "data", "legacyProducts.json");
const LEGACY_LOGO_FILE = "946363e1618f9f1d9800222ee0156477.jpeg";

const decode = (value = "") => String(value)
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", '"')
  .replaceAll("&#039;", "'")
  .replace(/<[^>]*>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const attr = (html, name) => (html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)`, "i")) || [])[1] || "";
const between = (html, pattern) => (html.match(pattern) || [])[1] || "";
const normalizeUrl = (url) => url.startsWith("//") ? `https:${url}` : url;

async function get(url) {
  const response = await fetch(url, { headers: { "user-agent": "CowinSupplyCatalogSync/1.0" } });
  if (!response.ok) throw new Error(`Failed ${response.status}: ${url}`);
  return response.text();
}

const sitemap = await get(`${LEGACY_ORIGIN}/sitemap.xml`);
const urls = [...sitemap.matchAll(/<loc>([^<]+\/product\/[^<]+\.html)<\/loc>/g)]
  .map((match) => match[1])
  .filter((url) => !/\/product\/index/i.test(url));

const products = [];
for (const url of urls) {
  const html = await get(url);
  const slug = decode(between(url, /\/product\/([^/?]+)\.html/i));
  const title = decode(between(html, /<h1[^>]*class=["'][^"']*product-show-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i) || between(html, /<title>([\s\S]*?)<\/title>/i));
  const category = decode(between(html, /class=["'][^"']*detail-cate-item[^"']*["'][^>]*>([\s\S]*?)<\/a>/i)) || "Power Tools";
  const description = decode(attr(html, "description"));
  const keywords = [...html.matchAll(/<a[^>]+href=["'][^"']*\/tag\/[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)].map((match) => decode(match[1])).filter(Boolean);
  const details = between(html, /class=["'][^"']*product-detail-text[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i);
  const imageUrls = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => normalizeUrl(match[1]).replace(/\?image_process=[^"']*/i, ""))
    .filter((image) => /cdn\.fuwucms\.com\/a\/375612959223\/files\//i.test(image) && !image.includes(LEGACY_LOGO_FILE));
  const productImage = normalizeUrl((between(html, /class=["'][^"']*lanyun-effect-top[^"']*["'][\s\S]*?<img[^>]+src=["']([^"']+)/i) || imageUrls[0] || "")).replace(/\?image_process=[^"']*/i, "");
  const detailImages = [...new Set(imageUrls.filter((image) => image !== productImage))].slice(0, 12);
  const published = decode(between(html, /Release time\s*:\s*([^<\n]+)/i));
  const summary = description.replace(/\|?-?Quzhou Qiying Import[^.]*\.?/i, "").trim() || `${title} from Cowin Supply.`;
  products.push({
    id: `product-${slug.toLowerCase()}`,
    type: "product",
    slug,
    title,
    category,
    image: productImage,
    gallery: [productImage, ...detailImages].filter(Boolean),
    summary,
    legacySourceUrl: url,
    legacyDescriptionHtml: details,
    status: "published",
    publishedAt: published ? new Date(`${published}T00:00:00.000Z`).toISOString() : "2026-05-14T00:00:00.000Z",
    createdAt: "2026-05-14T00:00:00.000Z",
    updatedAt: new Date().toISOString(),
    seoTitle: `${title} | Cowin Supply`,
    seoDescription: summary.slice(0, 155),
    canonicalUrl: `https://www.cowinsupply.com/product/${slug}.html`,
    primaryKeyword: keywords[0] || title,
    secondaryKeywords: keywords.slice(1),
    tags: keywords,
    geoSummary: `${title} is listed by Cowin Supply for B2B buyers evaluating ${category.toLowerCase()} options. Use the product details and enquiry form to request application-specific documentation, availability and a quotation.`,
    applications: ["Professional construction", "Workshop operations", "Industrial maintenance"],
    features: ["Legacy catalog product record migrated to Cowin Supply", "Original product images retained from the previous owned website", "Technical confirmation available through product enquiry"],
    specifications: [],
    faq: [
      { question: `How can I confirm the right ${title} configuration?`, answer: "Send the material, application, voltage preference and estimated order quantity through the enquiry form. Cowin Supply will confirm suitable configuration details before quotation." },
      { question: "Where does the product information come from?", answer: "This page was migrated from Cowin Supply's previous catalog. Original product images and available product descriptions have been retained; request current technical documents for final selection." }
    ]
  });
}

await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
await fs.writeFile(OUTPUT, JSON.stringify(products, null, 2));
console.log(`Imported ${products.length} legacy products into ${OUTPUT}`);
