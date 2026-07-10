import fs from "node:fs/promises";
import path from "node:path";

const cwd = process.cwd();
const publicDir = path.join(cwd, "public");
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.cowinsupply.com").replace(/\/$/, "");
const targets = [];

await addFile("index.html", "/");
await addFile("product/index.html", "/product");
await addFile("news/index.html", "/news");
await addFile("about/index.html", "/about");
await addFile("contact/index.html", "/contact");
await addFile("message/index.html", "/message");

for (const entry of await readDir("product")) {
  if (!entry.isFile() || !entry.name.endsWith(".html") || entry.name.startsWith("index")) continue;
  await addFile(path.join("product", entry.name), `/product/${encodeURIComponent(entry.name).replaceAll("%2E", ".")}`);
}

for (const entry of await readDir("tag")) {
  if (!entry.isDirectory()) continue;
  await addFile(path.join("tag", entry.name, "index.html"), `/tag/${encodeURIComponent(entry.name)}`);
}

console.log(JSON.stringify({ processed: targets.length, files: targets }, null, 2));

async function addFile(relativePath, canonicalPath) {
  const filePath = path.join(publicDir, relativePath);
  let html;
  try {
    html = await fs.readFile(filePath, "utf8");
  } catch {
    return;
  }

  const canonicalUrl = `${siteUrl}${canonicalPath}`;
  const tags = [
    `<link rel="canonical" href="${escapeAttr(canonicalUrl)}">`,
    '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">',
    `<meta property="og:url" content="${escapeAttr(canonicalUrl)}">`
  ].join("\n    ");
  const cleaned = html
    .replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/<meta\b[^>]*\bname=["']robots["'][^>]*>\s*/gi, "")
    .replace(/<meta\b[^>]*\bproperty=["']og:url["'][^>]*>\s*/gi, "");
  const next = /<\/head>/i.test(cleaned) ? cleaned.replace(/<\/head>/i, `    ${tags}\n</head>`) : cleaned;
  if (next !== html) await fs.writeFile(filePath, next, "utf8");
  targets.push(relativePath.replaceAll(path.sep, "/"));
}

async function readDir(relativePath) {
  try {
    return await fs.readdir(path.join(publicDir, relativePath), { withFileTypes: true });
  } catch {
    return [];
  }
}

function escapeAttr(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
