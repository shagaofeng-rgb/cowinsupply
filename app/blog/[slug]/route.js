import { getCmsItems, getSeoGoneUrls } from "@/lib/cmsStore";
import { renderBlogDetailHtml } from "@/lib/blogRendering";
import { notFoundResponse } from "@/lib/interiorRendering";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { slug } = await params;
  if ((await getSeoGoneUrls()).includes(`/blog/${slug}`)) return new Response("Gone", { status: 410 });
  const posts = await getCmsItems("blog");
  const post = posts.find((item) => item.slug === slug);
  if (!post) return notFoundResponse();
  return new Response(renderBlogDetailHtml({ post, relatedPosts: posts }), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "s-maxage=60, stale-while-revalidate=30" }
  });
}
