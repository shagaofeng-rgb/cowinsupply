import { getCmsItems } from "@/lib/cmsStore";
import { renderProductDetailHtml } from "@/lib/productRendering";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { slug: parts } = await params;
  const rawSlug = Array.isArray(parts) ? parts.join("/") : String(parts || "");
  if (/^index(?:\.html)?$/i.test(rawSlug)) {
    return Response.redirect(new URL("/product", request.url), 308);
  }
  const slug = rawSlug.replace(/\.html$/i, "");
  const products = await getCmsItems("product");
  const product = products.find((item) => item.slug === slug);
  if (!product) return new Response("Not found", { status: 404 });
  return new Response(renderProductDetailHtml({ product, relatedProducts: products.filter((item) => item.slug !== slug && item.category === product.category).slice(0, 3) }), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=0, must-revalidate" }
  });
}
