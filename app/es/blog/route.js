import { getCmsItems } from "@/lib/cmsStore";
import { renderBlogListHtml } from "@/lib/blogRendering";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await getCmsItems("blog");
  return new Response(renderBlogListHtml({ posts }), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "s-maxage=300, stale-while-revalidate=3600" }
  });
}
