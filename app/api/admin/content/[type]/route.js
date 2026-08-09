import { redirect } from "next/navigation";
import { apiError, apiOk, requireAdminApi } from "@/lib/adminApi";
import { appendAuditLog, deleteCmsItem, getCmsItems, restoreProductVersion, saveCmsItem, slugify, updateCmsItemStatus } from "@/lib/cmsStore";
import { refreshSitemap } from "@/lib/sitemapService";

const allowedTypes = new Set(["product", "news", "blog"]);

export async function GET(_request, { params }) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { type } = await params;
  if (!allowedTypes.has(type)) return apiError("Invalid content type", 404);
  return apiOk(await getCmsItems(type, { includeInactive: true }));
}

export async function POST(request, { params }) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { type } = await params;
  if (!allowedTypes.has(type)) return apiError("Invalid content type", 404);

  const form = await request.formData();
  const action = String(form.get("action") || "save");
  const slug = String(form.get("slug") || "").trim();

  if (action === "delete") {
    await deleteCmsItem(type, slug);
    await appendAuditLog({ action: "delete", module: type, target: slug });
  } else if (action === "offline" || action === "publish") {
    await updateCmsItemStatus(type, slug, action === "publish" ? "published" : "offline");
    await appendAuditLog({ action, module: type, target: slug });
  } else if (action === "restore" && type === "product") {
    const item = await restoreProductVersion(slug, String(form.get("versionId") || ""));
    await appendAuditLog({ action: "restore-version", module: type, target: item.slug });
  } else {
    const title = String(form.get("title") || "").trim();
    if (!title) return apiError("Title is required", 400);
    const item = await saveCmsItem({
      type,
      title,
      slug: slug || slugify(title),
      category: form.get("category"),
      categorySlug: form.get("categorySlug"),
      model: form.get("model"),
      image: form.get("image"),
      summary: form.get("summary"),
      gallery: parseJsonArray(form.get("gallery")),
      features: parseJsonArray(form.get("features")),
      applications: parseJsonArray(form.get("applications")),
      specifications: parseJsonArray(form.get("specifications")),
      faq: parseJsonArray(form.get("faq")),
      relatedProducts: parseJsonArray(form.get("relatedProducts")),
      relatedArticles: parseJsonArray(form.get("relatedArticles")),
      seoTitle: form.get("seoTitle"),
      seoDescription: form.get("seoDescription"),
      geoSummary: form.get("geoSummary"),
      parameterStatus: form.get("parameterStatus"),
      status: form.get("status") || "published",
      content: form.get("content"),
      authorId: form.get("authorId"),
      authorName: form.get("authorName")
    });
    await appendAuditLog({ action: "save", module: type, target: item.slug });
  }

  const sitemapRun = await refreshSitemap({ trigger: `admin_${type}_${action}`, submit: false });
  await appendAuditLog({
    action: "refresh-sitemap",
    module: "seo",
    target: `${sitemapRun.totalUrls || 0} urls`,
    result: sitemapRun.errors?.length ? "failed" : "success"
  });

  redirect(`/admin/${type === "product" ? "products" : type}`);
}

function parseJsonArray(value) {
  const text = String(value || "").trim();
  if (!text) return undefined;
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}
