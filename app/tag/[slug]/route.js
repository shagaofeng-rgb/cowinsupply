const TAG_REDIRECTS = [
  [/wall chas|wall slot|grooving/i, "/products/wall-chasers"],
  [/angle grinder|grinding/i, "/products/angle-grinders"],
  [/cordless drill|lithium drill/i, "/products/cordless-drills"],
  [/screwdriver/i, "/products/electric-screwdrivers"],
  [/jig saw|curve saw/i, "/products/jig-saws-curve-saws"],
  [/cold cutting saw/i, "/products/cold-cutting-saws"],
  [/annular cutter/i, "/products/annular-cutters-magnetic-drills"],
  [/laser measure|measuring tape|distance meter|diastimeter/i, "/products/measuring-tools"],
  [/water drilling rig/i, "/products/core-drills"],
  [/wall polishing/i, "/products/wall-polishing-machines"]
];

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { slug } = await params;
  const match = TAG_REDIRECTS.find(([pattern]) => pattern.test(decodeURIComponent(slug)));
  if (match) return Response.redirect(new URL(match[1], request.url), 301);
  return new Response("Gone", { status: 410 });
}
