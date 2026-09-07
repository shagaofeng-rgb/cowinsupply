import { getCmsItems } from "@/lib/cmsStore";
import { isCanonicalProductRecord } from "@/lib/catalogTaxonomy";
import { filterNews, newsFilterOptions, paginateNews } from "@/lib/newsQuery";
import { renderNewsListHtml } from "@/lib/newsRendering";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const requestedPage = Number(new URL(request.url).searchParams.get("page") || 1);
  if (requestedPage === 1 && new URL(request.url).searchParams.has("page")) return Response.redirect(new URL("/news", request.url), 301);
  const [news, products] = await Promise.all([getCmsItems("news"), getCmsItems("product")]);
  const canonicalProducts = products.filter(isCanonicalProductRecord);
  const filters = Object.fromEntries(new URL(request.url).searchParams.entries());
  const filtered = filterNews(news, filters);
  const pagination = paginateNews(filtered, filters);
  if (requestedPage > pagination.pageCount && pagination.pageCount > 0) return new Response("Not found", { status: 404 });
  return new Response(renderNewsListHtml({
    news: pagination.items,
    products: canonicalProducts,
    filters,
    options: newsFilterOptions(news, canonicalProducts),
    pagination
  }), {
    // News is backed by the operational content store. Do not serve an hour of stale
    // list data after an automated publication has passed all other checks.
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=0, must-revalidate" }
  });
}
