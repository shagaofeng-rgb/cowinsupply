export async function GET(request) {
  return Response.redirect(new URL("/blog", request.url), 308);
}
