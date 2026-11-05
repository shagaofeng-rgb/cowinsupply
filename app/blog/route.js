import { getCmsItems } from "@/lib/cmsStore";
import { BLOG_PAGE_SIZE, renderBlogListHtml, searchBlog } from "@/lib/blogRendering";
import { htmlResponse, notFoundResponse } from "@/lib/interiorRendering";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || 1);
  if (!Number.isSafeInteger(page) || page < 1) return notFoundResponse();
  if (page === 1 && url.searchParams.has("page")) {
    url.searchParams.delete("page");
    return Response.redirect(url, 301);
  }
  const query = (url.searchParams.get("q") || "").trim().slice(0, 120);
  const posts = searchBlog(await getCmsItems("blog"), query);
  const start = (page - 1) * BLOG_PAGE_SIZE;
  if (page > 1 && start >= posts.length) return notFoundResponse();
  return htmlResponse(renderBlogListHtml({ posts: posts.slice(start, start + BLOG_PAGE_SIZE), query, page, total: posts.length }), {
    "cache-control": query ? "no-store" : "s-maxage=60, stale-while-revalidate=30"
  });
}
