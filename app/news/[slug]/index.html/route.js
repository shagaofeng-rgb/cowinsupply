import { getCmsItems } from "@/lib/cmsStore";
import { renderLegacyNewsArchive, legacyNewsSections } from "@/lib/interiorArchive";
import { htmlResponse, notFoundResponse } from "@/lib/interiorRendering";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { slug } = await params;
  if (!legacyNewsSections.has(slug)) return notFoundResponse();
  const posts = slug === "2" ? await getCmsItems("blog") : [];
  return htmlResponse(renderLegacyNewsArchive(slug, posts), { "cache-control": "public, max-age=0, must-revalidate" });
}
