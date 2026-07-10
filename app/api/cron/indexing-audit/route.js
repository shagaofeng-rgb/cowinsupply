import { apiError, apiOk } from "@/lib/adminApi";
import { inspectUrlInGoogle } from "@/lib/googleSeoService";
import { getSitemapUrls } from "@/lib/sitemapService";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") || "";
    const token = request.nextUrl.searchParams.get("secret") || "";
    if (auth !== `Bearer ${secret}` && token !== secret) return apiError("Unauthorized cron request", 401);
  }

  const requestedUrl = request.nextUrl.searchParams.get("url") || "";
  if (requestedUrl && !isProductionUrl(requestedUrl)) return apiError("Only production-site URLs can be inspected", 400);

  const allUrls = await getSitemapUrls();
  const offset = Math.max(0, Number(request.nextUrl.searchParams.get("offset")) || 0);
  const limit = Math.min(20, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 10));
  const urls = requestedUrl ? [requestedUrl] : allUrls.slice(offset, offset + limit);
  const results = await Promise.all(urls.map((inspectionUrl) => inspectUrlInGoogle({ inspectionUrl })));

  return apiOk({
    checkedAt: new Date().toISOString(),
    totalSitemapUrls: allUrls.length,
    offset,
    limit: urls.length,
    results
  });
}

function isProductionUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "www.cowinsupply.com";
  } catch {
    return false;
  }
}
