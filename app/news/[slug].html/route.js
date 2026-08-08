export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { slug } = await params;
  const cleanSlug = String(slug || "").replace(/\.html$/i, "");
  // The public News URL has no extension. Keep legacy links valid without
  // creating a second, canonical-looking copy of the same article.
  return Response.redirect(new URL(`/news/${encodeURIComponent(cleanSlug)}`, request.url), 301);
}
