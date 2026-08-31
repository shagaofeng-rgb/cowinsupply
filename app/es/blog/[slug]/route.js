export async function GET(request, { params }) {
  const { slug } = await params;
  return Response.redirect(new URL(`/blog/${encodeURIComponent(slug)}`, request.url), 308);
}
