import { timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// The third-party plugin may continue to verify its connection, but it cannot publish.
// Editorial Blog publishing is deliberately restricted to authenticated admin workflows.
export async function POST(request) {
  try {
    const input = await readInput(request);
    const configuredKey = String(process.env.WEBHOOK_ARTICLE_SIGN || process.env.BLOG_WEBHOOK_API_KEY || "").trim();
    if (!configuredKey) return response(0, "Webhook signing key is not configured.");
    if (!safeEqual(String(input.sign || ""), configuredKey)) return response(0, "Invalid signing key.");
    if (isVerificationPayload(input)) return response(1, "Verification successful.");
    return response(0, "Blog articles require manual editorial publishing in the Cowin Supply admin.");
  } catch (error) {
    console.error("Blog webhook verification failed", error instanceof Error ? error.message : "unknown-error");
    return response(0, "Webhook request could not be verified.");
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

function response(code, msg) {
  return Response.json({ code, msg }, { status: 200, headers: { "cache-control": "no-store" } });
}

function safeEqual(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function isVerificationPayload(input) {
  const title = String(input.title || "").replace(/<[^>]*>/g, " ").trim();
  const content = String(input.content || "").replace(/<[^>]*>/g, " ").trim();
  if (!title && !content) return true;
  return title.length < 6 || content.length < 40;
}
