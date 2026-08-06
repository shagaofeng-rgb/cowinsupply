import { createHash, timingSafeEqual } from "node:crypto";
import { appendAuditLog, getCmsItems, saveCmsItem, slugify } from "@/lib/cmsStore";
import { refreshSitemap } from "@/lib/sitemapService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const input = await readInput(request);
    const configuredKey = String(process.env.BLOG_WEBHOOK_API_KEY || "").trim();
    if (!configuredKey) return response(0, "Blog webhook is not configured");
    if (!safeEqual(String(input.sign || ""), configuredKey)) return response(0, "Invalid API key");

    // Some publishing plugins validate a connection with only the API key before sending article fields.
    if (!String(input.title || "").trim() && !String(input.content || "").trim()) {
      return response(1, "Webhook verified");
    }

    const title = normalizeText(input.title, 180);
    const rawContent = String(input.content || "").trim();
    const classId = normalizeText(input.class_id || "blog", 80) || "blog";
    const authorId = normalizeText(input.author_id || "admin", 80) || "admin";
    const imageUrl = normalizeUrl(input.image_url || "");
    if (!title) return response(0, "Title is required");
    if (!rawContent) return response(0, "Content is required");
    if (rawContent.length > 100000) return response(0, "Content exceeds 100000 characters");
    if (input.image_url && !imageUrl) return response(0, "image_url must be an http or https URL");

    const content = toSafeHtml(rawContent);
    const contentHash = createHash("sha256").update(`${title}\n${rawContent}`).digest("hex");
    const existing = await getCmsItems("blog", { includeInactive: true });
    const duplicate = existing.find((item) => item.contentHash === contentHash);
    if (duplicate) return response(1, "Published successfully", { id: duplicate.id, slug: duplicate.slug, url: `/blog/${duplicate.slug}`, duplicate: true });

    const slug = uniqueSlug(slugify(title), existing);
    const summary = toPlainText(rawContent).slice(0, 300);
    const item = await saveCmsItem({
      type: "blog",
      slug,
      title,
      content,
      category: classId,
      authorId,
      authorName: authorId,
      image: imageUrl,
      summary,
      status: "published",
      language: "en",
      seoTitle: title,
      seoDescription: summary,
      primaryKeyword: title,
      geoSummary: summary,
      coverImageAlt: title,
      webhookClassId: classId,
      contentHash
    });
    const sitemap = await refreshSitemap({ trigger: "blog_webhook_publish", submit: false });
    await appendAuditLog({ actor: "blog-webhook", action: "publish", module: "blog", target: item.slug, result: sitemap.errors?.length ? "success-with-sitemap-warning" : "success" });
    return response(1, "Published successfully", { id: item.id, slug: item.slug, url: `/blog/${item.slug}` });
  } catch (error) {
    console.error("Blog webhook publish failed", error instanceof Error ? error.message : "unknown-error");
    return response(0, "Publication failed. Please retry.");
  }
}

export async function GET() {
  return response(0, "Use POST with application/x-www-form-urlencoded fields");
}

async function readInput(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return await request.json();
  const form = await request.formData();
  return Object.fromEntries(["sign", "class_id", "title", "content", "author_id", "image_url"].map((key) => [key, form.get(key) || ""]));
}

function response(code, msg, data = {}) {
  return Response.json({ code, msg, ...data }, { status: 200, headers: { "cache-control": "no-store" } });
}

function safeEqual(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function normalizeText(value, limit) { return String(value || "").trim().replace(/\s+/g, " ").slice(0, limit); }
function normalizeUrl(value) { try { const url = new URL(String(value || "")); return ["http:", "https:"].includes(url.protocol) ? url.toString() : ""; } catch { return ""; } }
function uniqueSlug(base, existing) { const seed = base || "blog-article"; const used = new Set(existing.map((item) => item.slug)); if (!used.has(seed)) return seed; for (let index = 2; index < 1000; index += 1) { const candidate = `${seed}-${index}`; if (!used.has(candidate)) return candidate; } return `${seed}-${Date.now()}`; }
function toPlainText(value) { return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); }
function toSafeHtml(value) { const escaped = String(value || "").replace(/<\/?(script|style|iframe|object|embed|form)[^>]*>/gi, "").replace(/\son\w+\s*=\s*(["']).*?\1/gi, "").replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, "").replace(/javascript:/gi, ""); return /<\s*[a-z][\s\S]*>/i.test(escaped) ? escaped : escaped.split(/\n{2,}/).map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`).join(""); }
