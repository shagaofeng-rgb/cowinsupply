import { NextResponse } from "next/server";

const TAG_REDIRECTS = [
  [/wall chas|wall slot|grooving/i, "/products/wall-chasers"],
  [/angle grinder|grinding/i, "/products/brushless-angle-grinders"],
  [/cordless drill|lithium drill|screwdriver/i, "/products/cordless-power-tools"],
  [/jig saw|curve saw|cold cutting saw|annular cutter/i, "/products/brushless-saws"],
  [/laser measure|measuring tape|distance meter|diastimeter/i, "/products/laser-measuring-tools"],
  [/water drilling rig|wall polishing/i, "/products/specialty-tools"]
];

export function middleware(request) {
  const encodedSlug = request.nextUrl.pathname.slice("/tag/".length);
  const slug = decodeURIComponent(encodedSlug);
  const match = TAG_REDIRECTS.find(([pattern]) => pattern.test(slug));
  if (match) return NextResponse.redirect(new URL(match[1], request.url), 301);
  return new NextResponse("Gone", { status: 410, headers: { "cache-control": "public, max-age=3600" } });
}

export const config = { matcher: ["/tag/:path*"] };
