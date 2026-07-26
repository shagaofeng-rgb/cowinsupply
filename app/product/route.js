import { getCmsItems } from "@/lib/cmsStore";
import { renderProductListHtml } from "@/lib/productRendering";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(renderProductListHtml({ products: await getCmsItems("product") }), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=0, must-revalidate" }
  });
}
