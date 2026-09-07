import { apiError, apiOk } from "@/lib/adminApi";
import { requireCronSecret } from "@/lib/cronAuth";
import { inspectUrlInGoogle } from "@/lib/googleSeoService";
import { getPersistentValue, hasPersistentStore, setPersistentValue } from "@/lib/persistentStore";
import { getSitemapUrls } from "@/lib/sitemapService";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const AUDIT_CURSOR_KEY = "gsc-indexing-audit-cursor-v1";
const AUDIT_LOG_KEY = "gsc-indexing-audit-runs-v1";
const MAX_AUDIT_LOGS = 90;

export async function GET(request) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;

  const requestedUrl = request.nextUrl.searchParams.get("url") || "";
  if (requestedUrl && !isProductionUrl(requestedUrl)) return apiError("Only production-site URLs can be inspected", 400);

  const allUrls = await getSitemapUrls();
  const explicitOffset = request.nextUrl.searchParams.has("offset");
  const storedOffset = hasPersistentStore() && !requestedUrl && !explicitOffset
    ? Number(await getPersistentValue(AUDIT_CURSOR_KEY)) || 0
    : 0;
  const offset = Math.max(0, Number(request.nextUrl.searchParams.get("offset")) || storedOffset);
  const limit = Math.min(20, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 10));
  const urls = requestedUrl ? [requestedUrl] : rotateUrls(allUrls, offset, limit);
  const results = await Promise.all(urls.map((inspectionUrl) => inspectUrlInGoogle({ inspectionUrl })));
  const checkedAt = new Date().toISOString();
  const run = {
    checkedAt,
    totalSitemapUrls: allUrls.length,
    offset,
    limit: urls.length,
    nextOffset: allUrls.length ? (offset + urls.length) % allUrls.length : 0,
    summary: summarize(results),
    results
  };

  if (hasPersistentStore()) {
    const previous = await getPersistentValue(AUDIT_LOG_KEY);
    await Promise.all([
      !requestedUrl && !explicitOffset ? setPersistentValue(AUDIT_CURSOR_KEY, run.nextOffset) : Promise.resolve(),
      setPersistentValue(AUDIT_LOG_KEY, [...(Array.isArray(previous) ? previous : []), run].slice(-MAX_AUDIT_LOGS))
    ]);
  }

  return apiOk(run);
}

function rotateUrls(urls, offset, limit) {
  if (!urls.length) return [];
  return Array.from({ length: Math.min(limit, urls.length) }, (_, index) => urls[(offset + index) % urls.length]);
}

function summarize(results) {
  return results.reduce((summary, result) => {
    summary.checked += 1;
    if (!result.success) summary.errors += 1;
    const verdict = result.verdict || (result.error ? "ERROR" : "UNKNOWN");
    summary.verdicts[verdict] = (summary.verdicts[verdict] || 0) + 1;
    return summary;
  }, { checked: 0, errors: 0, verdicts: {} });
}

function isProductionUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "www.cowinsupply.com";
  } catch {
    return false;
  }
}
