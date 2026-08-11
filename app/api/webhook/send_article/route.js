import crypto, { timingSafeEqual } from "node:crypto";
import { appendAuditLog, getCmsItems, saveCmsItem, slugify } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const input = await readInput(request);
    const configuredKey = String(process.env.WEBHOOK_ARTICLE_SIGN || process.env.BLOG_WEBHOOK_API_KEY || "").trim();
    if (!configuredKey) return response(0, "Webhook signing key is not configured.");
    if (!safeEqual(String(input.sign || ""), configuredKey)) return response(0, "Invalid signing key.");
    if (isVerificationPayload(input)) return response(1, "Verification successful.");

    const article = normalizeArticle(input);
    if (!article.title || article.title.length < 6) return response(0, "Article title must contain at least 6 characters.");
    if (!article.contentText || article.contentText.length < 40) return response(0, "Article content must contain at least 40 characters.");
    if (article.classId && article.classId !== "blog" && article.classId !== "31") return response(0, "Unsupported article category.");

    const existing = await getCmsItems("blog", { includeInactive: true });
    const duplicate = existing.find((item) => item.webhookContentHash === article.contentHash);
    if (duplicate) return response(1, "Article already published.");

    const slug = uniqueSlug(slugify(article.title), existing);
    const saved = await saveCmsItem({
      type: "blog",
      slug,
      title: article.title,
      content: article.content,
      summary: article.summary,
      image: article.image,
      coverImageAlt: article.title,
      category: "Blog",
      authorId: article.authorId,
      authorName: article.authorId || "Cowin Supply",
      class_id: article.classId || "blog",
      contentHash: article.contentHash,
      webhookContentHash: article.contentHash,
      webhookSource: "custom-framework-webhook",
      status: "published",
      publishedAt: new Date().toISOString(),
      seoTitle: `${article.title} | Cowin Supply`.slice(0, 155),
      seoDescription: article.summary.slice(0, 155),
      canonicalUrl: `https://www.cowinsupply.com/blog/${slug}`,
      primaryKeyword: article.title
    });
    await appendAuditLog({ actor: article.authorId || "blog-webhook", action: "webhook_blog_publish", module: "blog", target: saved.slug, result: "success" });
    return response(1, "Published successfully.");
  } catch (error) {
    console.error("Blog webhook publication failed", error instanceof Error ? error.message : "unknown-error");
    return response(0, "Article could not be published.");
  }
}

export async function GET() {
  return response(0, "Use an application/x-www-form-urlencoded POST request.");
}

async function readInput(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return await request.json();
  const form = await request.formData();
  return Object.fromEntries(["sign", "class_id", "title", "content", "author_id", "image_url"].map((key) => [key, form.get(key) || ""]));
}

function normalizeArticle(input) {
  const title = stripHtml(input.title).slice(0, 180);
  const content = sanitizeArticleHtml(String(input.content || "")).slice(0, 100000);
  const contentText = stripHtml(content);
  const image = safeImageUrl(input.image_url);
  const summary = contentText.slice(0, 260).trim();
  return {
    title,
    content,
    contentText,
    image,
    summary,
    classId: String(input.class_id || "").trim().toLowerCase(),
    authorId: String(input.author_id || "").trim().slice(0, 120),
    contentHash: crypto.createHash("sha256").update(`${title}\n${contentText}`).digest("hex")
  };
}

function sanitizeArticleHtml(value) {
  return String(value || "")
    .replace(/<\/?(script|style|iframe|object|embed|form)[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*(["']).*?\1/gi, "")
    .replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, "")
    .replace(/javascript:/gi, "");
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function safeImageUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function uniqueSlug(base, existing) {
  const used = new Set(existing.map((item) => item.slug));
  let slug = base || `blog-${Date.now()}`;
  let index = 2;
  while (used.has(slug)) slug = `${base}-${index++}`;
  return slug;
}

function response(code, msg) {
  return Response.json({ code, msg }, { status: 200, headers: { "cache-control": "no-store" } });
}

function safeEqual(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function isVerificationPayload(input) {
  const title = stripHtml(input.title);
  const content = stripHtml(input.content);
  if (!title && !content) return true;
  return title.length < 6 || content.length < 40;
}
