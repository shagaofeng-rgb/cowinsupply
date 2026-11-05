import { getCmsItems } from "@/lib/cmsStore";
import { isCanonicalProductRecord } from "@/lib/catalogTaxonomy";
import { notFoundResponse } from "@/lib/interiorRendering";
import { filterNews, newsFilterOptions, paginateNews } from "@/lib/newsQuery";
import { renderNewsListHtml } from "@/lib/newsRendering";
import { uniqueNews } from "@/lib/newsDuplicates";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const url = new URL(request.url);
  const rawPage = url.searchParams.get("page");
  const requestedPage = Number(rawPage || 1);
  if (!Number.isSafeInteger(requestedPage) || requestedPage < 1) return notFoundResponse();
  if (requestedPage === 1 && url.searchParams.has("page")) {
    url.searchParams.delete("page");
    return Response.redirect(url, 301);
  }
  const [news, products] = await Promise.all([getCmsItems("news"), getCmsItems("product")]);
  const canonicalProducts = products.filter(isCanonicalProductRecord);
  const filters = Object.fromEntries(["q", "category", "product", "source", "language", "tag", "period", "page", "pageSize"].flatMap(key =>
    url.searchParams.has(key) ? [[key, (url.searchParams.get(key) || "").trim().slice(0, 160)]] : []
  ));
  const publicNews = uniqueNews(news);
  const filtered = filterNews(publicNews, filters);
  const pagination = paginateNews(filtered, filters);
  if (requestedPage > pagination.pageCount) return notFoundResponse();
  return new Response(renderNewsListHtml({
    news: pagination.items,
    products: canonicalProducts,
    filters,
    options: newsFilterOptions(publicNews, canonicalProducts),
    pagination
  }), {
    // News is backed by the operational content store. Do not serve an hour of stale
    // list data after an automated publication has passed all other checks.
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=0, must-revalidate" }
  });
}
