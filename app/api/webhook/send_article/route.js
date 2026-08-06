import { createHash, timingSafeEqual } from "node:crypto";
import { appendAuditLog, getCmsItems, saveCmsItem, slugify } from "@/lib/cmsStore";
import { refreshSitemap } from "@/lib/sitemapService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const input = await readInput(request);
    const configuredKey = String(process.env.WEBHOOK_ARTICLE_SIGN || process.env.BLOG_WEBHOOK_API_KEY || "").trim();
    if (!configuredKey) return response(0, "服务器未配置 WEBHOOK_ARTICLE_SIGN");
    if (!safeEqual(String(input.sign || ""), configuredKey)) return response(0, "秘钥错误");

    if (isVerificationPayload(input)) {
      return response(1, "验证成功");
    }

    return response(0, "Blog articles require manual editorial publishing in the Cowin Supply admin.");

    const title = normalizeText(input.title, 180);
    const rawContent = String(input.content || "").trim();
    const classId = normalizeText(input.class_id || "blog", 80) || "blog";
    const authorId = normalizeText(input.author_id || "admin", 80) || "admin";
    const imageUrl = normalizeUrl(input.image_url || "");
    if (!title) return response(0, "文章标题不能为空");
    if (!rawContent) return response(0, "文章正文不能为空");
    if (rawContent.length > 100000) return response(0, "文章正文超过 100000 字符限制");
    if (input.image_url && !imageUrl) return response(0, "image_url 必须是 http 或 https 图片地址");

    const content = toSafeHtml(rawContent);
    const contentHash = createHash("sha256").update(`${title}\n${rawContent}`).digest("hex");
    const existing = await getCmsItems("blog", { includeInactive: true });
    const duplicate = existing.find((item) => item.contentHash === contentHash);
    if (duplicate) return response(1, "发布成功", { id: duplicate.id, slug: duplicate.slug, url: `/blog/${duplicate.slug}`, duplicate: true });

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
    return response(1, "发布成功", { id: item.id, slug: item.slug, url: `/blog/${item.slug}` });
  } catch (error) {
    console.error("Blog webhook publish failed", error instanceof Error ? error.message : "unknown-error");
    return response(0, "发布失败，请稍后重试");
  }
}

export async function GET() {
  return response(0, "请使用 application/x-www-form-urlencoded 的 POST 请求");
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

function isVerificationPayload(input) {
  const title = toPlainText(input.title || "").trim();
  const content = toPlainText(input.content || "").trim();
  if (!title && !content) return true;
  const placeholder = /^(test|testing|title|content|demo|验证|测试|标题|正文)$/i;
  return title.length < 6 || content.length < 40 || placeholder.test(title) || placeholder.test(content);
}

function normalizeText(value, limit) { return String(value || "").trim().replace(/\s+/g, " ").slice(0, limit); }
function normalizeUrl(value) { try { const url = new URL(String(value || "")); return ["http:", "https:"].includes(url.protocol) ? url.toString() : ""; } catch { return ""; } }
function uniqueSlug(base, existing) { const seed = base || "blog-article"; const used = new Set(existing.map((item) => item.slug)); if (!used.has(seed)) return seed; for (let index = 2; index < 1000; index += 1) { const candidate = `${seed}-${index}`; if (!used.has(candidate)) return candidate; } return `${seed}-${Date.now()}`; }
function toPlainText(value) { return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); }
function toSafeHtml(value) { const escaped = String(value || "").replace(/<\/?(script|style|iframe|object|embed|form)[^>]*>/gi, "").replace(/\son\w+\s*=\s*(["']).*?\1/gi, "").replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, "").replace(/javascript:/gi, ""); return /<\s*[a-z][\s\S]*>/i.test(escaped) ? escaped : escaped.split(/\n{2,}/).map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`).join(""); }
