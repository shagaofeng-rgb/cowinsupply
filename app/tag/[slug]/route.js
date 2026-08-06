const TAG_REDIRECTS = [
  [/wall chas|wall slot|grooving/i, "/products/wall-chasers"],
  [/angle grinder|grinding/i, "/products/brushless-angle-grinders"],
  [/cordless drill|lithium drill|screwdriver/i, "/products/cordless-power-tools"],
  [/jig saw|curve saw|cold cutting saw|annular cutter/i, "/products/brushless-saws"],
  [/laser measure|measuring tape|distance meter|diastimeter/i, "/products/laser-measuring-tools"],
  [/water drilling rig|wall polishing/i, "/products/specialty-tools"]
];

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { slug } = await params;
  const match = TAG_REDIRECTS.find(([pattern]) => pattern.test(decodeURIComponent(slug)));
  if (match) return Response.redirect(new URL(match[1], request.url), 301);
  return new Response("Gone", { status: 410 });
}
