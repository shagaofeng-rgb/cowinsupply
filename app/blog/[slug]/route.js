import { getCmsItems, getSeoGoneUrls } from "@/lib/cmsStore";
import { renderBlogDetailHtml } from "@/lib/blogRendering";
import { publicHtmlResponse } from "@/lib/staticHtml";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { slug } = await params;
  if ((await getSeoGoneUrls()).includes(`/blog/${slug}`)) return new Response("Gone", { status: 410 });
  const posts = await getCmsItems("blog");
  const post = posts.find((item) => item.slug === slug);
  if (!post) return publicHtmlResponse(`blog/${slug}`, { canonicalPath: new URL(request.url).pathname });
  return new Response(renderBlogDetailHtml({ post, relatedPosts: posts }), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "s-maxage=300, stale-while-revalidate=3600" }
  });
}
