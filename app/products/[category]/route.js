import { getCmsItems } from "@/lib/cmsStore";
import { renderProductListHtml } from "@/lib/productRendering";

export const dynamic = "force-dynamic";

const CATEGORIES = {
  "wall-chasers": {
    title: "Wall chasers for controlled slot cutting",
    description: "Explore Cowin Supply wall chaser options for electrical installation and controlled wall-slot cutting. Confirm material, voltage and required slot dimensions before ordering.",
    terms: ["wall", "chaser", "slot", "groov"]
  },
  "brushless-angle-grinders": {
    title: "Brushless angle grinders for professional work",
    description: "Browse Cowin Supply brushless angle grinder products for professional cutting, grinding and preparation tasks. Ask for the current configuration and technical details.",
    terms: ["angle grinder", "grinder", "grinding"]
  },
  "cordless-power-tools": {
    title: "Cordless power tools for trade applications",
    description: "Browse Cowin Supply cordless drilling and fastening tools for trade and workshop applications. Confirm battery platform and accessories before ordering.",
    terms: ["cordless", "drill", "screwdriver", "lithium"]
  },
  "brushless-saws": {
    title: "Brushless saws and cutting tools",
    description: "Browse Cowin Supply saw and cutting-tool products for application-specific sourcing. Share the material, cut type and quantity for product selection support.",
    terms: ["saw", "cutter", "cutting", "annular"]
  },
  "laser-measuring-tools": {
    title: "Laser measuring tools for layout work",
    description: "Browse Cowin Supply laser measuring and distance-measurement products for layout and site measurement. Confirm measuring range and required precision before ordering.",
    terms: ["laser", "measure", "distance", "tape"]
  },
  "specialty-tools": {
    title: "Specialty tools for specific jobsite tasks",
    description: "Browse Cowin Supply specialty tools for defined construction and workshop tasks. Contact our team with your application requirements for current product guidance.",
    terms: ["water", "polish", "specialty", "rig"]
  }
};

export async function GET(request, { params }) {
  const { category } = await params;
  const config = CATEGORIES[category];
  if (!config) return new Response("Not found", { status: 404 });
  const products = await getCmsItems("product");
  const selected = products.filter((item) => {
    const haystack = `${item.title || ""} ${item.category || ""} ${item.summary || ""}`.toLowerCase();
    return config.terms.some((term) => haystack.includes(term));
  });
  return new Response(renderProductListHtml({
    products: selected,
    title: config.title,
    description: config.description,
    eyebrow: "Product category",
    canonical: `${new URL(request.url).origin}/products/${category}`
  }), { headers: { "content-type": "text/html; charset=utf-8" } });
}
