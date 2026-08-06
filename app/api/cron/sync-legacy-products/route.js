import legacyProducts from "@/data/legacyProducts.json";
import { apiError, apiOk } from "@/lib/adminApi";
import { appendAuditLog, replaceCmsItems } from "@/lib/cmsStore";
import { refreshSitemap } from "@/lib/sitemapService";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") || "";
    const token = request.nextUrl.searchParams.get("secret") || "";
    if (auth !== `Bearer ${secret}` && token !== secret) return apiError("Unauthorized cron request", 401);
  }
  const products = await replaceCmsItems("product", legacyProducts);
  const sitemap = await refreshSitemap({ trigger: "legacy_product_sync", submit: false });
  await appendAuditLog({ action: "replace", module: "product", target: `${products.length} legacy products` });
  return apiOk({ imported: products.length, sitemap });
}
