import { redirect } from "next/navigation";
import { apiError, apiOk, requireAdminApi } from "@/lib/adminApi";
import { appendAuditLog, deleteCmsItem, getCmsItems, saveCmsItem, slugify, updateCmsItemStatus } from "@/lib/cmsStore";

const allowedTypes = new Set(["product", "news"]);

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
  } else {
    const title = String(form.get("title") || "").trim();
    if (!title) return apiError("Title is required", 400);
    const item = await saveCmsItem({
      type,
      title,
      slug: slug || slugify(title),
      category: form.get("category"),
      image: form.get("image"),
      summary: form.get("summary"),
      status: "published"
    });
    await appendAuditLog({ action: "save", module: type, target: item.slug });
  }

  redirect(`/admin/${type === "product" ? "products" : "news"}`);
}
