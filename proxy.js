import { NextResponse } from "next/server";

const TAG_REDIRECTS = [
  [/wall[- ]chas|wall[- ]slot|grooving/i, "/products/wall-chasers"],
  [/concrete[- ]wall[- ]cutting/i, "/products/concrete-cutting-tools"],
  [/angle[- ]grinder|grinding/i, "/products/angle-grinders"],
  [/cordless[- ]drill|lithium[- ]drill/i, "/products/cordless-drills"],
  [/industrial[- ]electric[- ]drill/i, "/products/drilling-tools"],
  [/screwdriver/i, "/products/electric-screwdrivers"],
  [/jig[- ]saw|curve[- ]saw/i, "/products/jig-saws-curve-saws"],
  [/cold[- ](?:cutting[- ])?saw/i, "/products/cold-cutting-saws"],
  [/annular[- ]cutter/i, "/products/annular-cutters-magnetic-drills"],
  [/laser[- ](?:measure|meter)|measuring[- ]tape|distance[- ]meter|diastimeter/i, "/products/measuring-tools"],
  [/water[- ]drilling[- ]rig/i, "/products/core-drills"],
  [/wall[- ](?:polishing|sander)/i, "/products/wall-polishing-machines"]
];

export function proxy(request) {
  const encodedSlug = request.nextUrl.pathname.slice("/tag/".length);
  let slug = "";
  try { slug = decodeURIComponent(encodedSlug); } catch { /* Invalid legacy URLs are gone. */ }
  const match = TAG_REDIRECTS.find(([pattern]) => pattern.test(slug));
  if (match) return NextResponse.redirect(new URL(match[1], request.url), 301);
  return new NextResponse("Gone", { status: 410, headers: { "cache-control": "public, max-age=3600" } });
}

export const config = { matcher: ["/tag/:path*"] };
