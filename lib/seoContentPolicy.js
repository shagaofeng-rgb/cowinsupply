import { normalizeProductCatalogRecord } from "@/lib/catalogTaxonomy";
import { getVerifiedTechnicalProductData } from "@/lib/productTechnicalData";

export const SEO_CLEANUP_VERSION = "2026-08-product-technical-data-v5";

export const LEGACY_NEWS_REDIRECTS = new Map([
  ["brushlessangelgrinders", "/blog/brushless-angle-grinder-buyer-guide"],
  ["AngleGrinderBrushless", "/blog/brushless-angle-grinder-buyer-guide"],
  ["AngleGrinders", "/blog/brushless-angle-grinder-buyer-guide"],
  ["35", "/blog/brushless-angle-grinder-buyer-guide"],
  ["anglegrinderskeyrole", "/blog/brushless-angle-grinder-buyer-guide"],
  ["36", "/blog/brushless-angle-grinder-buyer-guide"],
  ["IndustrialAngleGrinder", "/blog/brushless-angle-grinder-buyer-guide"],
  ["AngleGrinderIndustry", "/blog/brushless-angle-grinder-buyer-guide"],
  ["anglegrinder", "/blog/angle-grinder-troubleshooting-and-safety"],
  ["repair", "/blog/angle-grinder-troubleshooting-and-safety"],
  ["WallChaseImproves", "/blog/brushless-wall-chaser-selection-guide"]
]);

export const WEBHOOK_TEST_BLOG_SLUG = "cowin-supply-blog-webhook-production-verification";
const TEMPLATE_MARKERS = ["Key takeaways", "Original source facts", "Why it matters", "Cowin Supply view", "How Cowin Supply can help", "Source information"];
const TEMPLATE_SOURCES = /constructiondive\.com|manufacturingdive\.com|protoolreviews\.com|toolguyd\.com/i;

export function isAutoTemplateNews(item) {
  const content = String(item.content || "");
  if (content.includes("The source item was published within the configured 72-hour collection window")) return true;
  const markerCount = TEMPLATE_MARKERS.filter((marker) => content.includes(marker)).length;
  return markerCount >= 4 && TEMPLATE_SOURCES.test(`${item.sourceUrl || ""} ${item.sourcePublisher || ""}`);
}

export function isRemovedNewsSlug(slug) {
  return LEGACY_NEWS_REDIRECTS.has(String(slug || ""));
}

export function contentCleanupPlan(items) {
  const deletedNews = items.filter((item) => item.type === "news" && (isAutoTemplateNews(item) || LEGACY_NEWS_REDIRECTS.has(item.slug)));
  const deletedBlog = items.filter((item) => item.type === "blog" && item.slug === WEBHOOK_TEST_BLOG_SLUG);
  const retained = items.filter((item) => !deletedNews.includes(item) && !deletedBlog.includes(item));
  const currentSlugs = new Set(retained.filter((item) => item.type === "blog").map((item) => item.slug));
  const guides = guidePosts().filter((item) => !currentSlugs.has(item.slug));
  return { nextItems: normalizeProductRecords([...retained, ...guides]), deletedNews, deletedBlog, guides };
}

function normalizeProductRecords(items) {
  return items.map((item) => {
    if (item.type !== "product") return item;
    const normalized = normalizeProductCatalogRecord(item);
    const technicalData = getVerifiedTechnicalProductData(item);
    const specifications = technicalData?.specifications || (Array.isArray(item.specifications) ? item.specifications.filter((row) => row?.label && row?.value && row?.verified === true) : []);
    const currentFeatures = Array.isArray(item.features) ? item.features : [];
    return {
      ...normalized,
      ...(technicalData || {}),
      specifications,
      features: technicalData?.features || currentFeatures.filter((feature) => !/legacy catalog|previous owned website|technical confirmation available/i.test(String(feature))),
      geoSummary: technicalData?.summary || normalized.geoSummary,
      parameterStatus: technicalData ? (technicalData.verified === false ? "pending-confirmation" : "verified") : normalized.parameterStatus,
      seoIndexable: technicalData?.verified === false ? false : specifications.length > 0
    };
  });
}

function guidePosts() {
  const now = new Date().toISOString();
  const base = { type: "blog", status: "published", language: "en", authorName: "Cowin Supply Editorial Team", authorId: "cowin-supply-editorial", contentOrigin: "editorial", editorialStatus: "reviewed", seoIndexable: true, reviewedBy: "Cowin Supply Editorial Team", reviewedAt: now, createdAt: now, updatedAt: now, publishedAt: now };
  return [
    { ...base, id: "blog-brushless-angle-grinder-buyer-guide", slug: "brushless-angle-grinder-buyer-guide", title: "Brushless Angle Grinder Buyer Guide | Cowin Supply", seoTitle: "Brushless Angle Grinder Buyer Guide | Cowin Supply", seoDescription: "A practical wholesale and OEM selection guide for brushless angle grinders.", summary: "A practical selection guide for wholesale and OEM brushless angle grinder sourcing.", category: "Buyer Guides", content: "<h1>How to Choose a Brushless Angle Grinder for Wholesale and OEM Supply</h1><p>Selecting an angle grinder starts with the intended work, local electrical requirements and the product documentation available for the selected model.</p><h2>Selection points</h2><ul><li>Choose corded or cordless power according to operating time, battery ecosystem and jobsite access.</li><li>Confirm disc diameter, rated power, no-load speed, soft start, overload protection, restart protection and switch design against the verified datasheet.</li><li>Assess housing and guard materials for the intended cutting or grinding work.</li><li>Confirm voltage and frequency before quotation.</li></ul><h2>OEM and private-label checklist</h2><p>Discuss logo, colour, packaging, manuals, samples and batch evaluation only after the supplier confirms the selected model and configuration.</p><h2>Related Cowin Supply products</h2><p>View the current angle grinder product records and request model-specific documentation before placing an order.</p>" },
    { ...base, id: "blog-angle-grinder-troubleshooting-and-safety", slug: "angle-grinder-troubleshooting-and-safety", title: "Angle Grinder Troubleshooting and Safety Guide | Cowin Supply", seoTitle: "Angle Grinder Troubleshooting and Safety Guide | Cowin Supply", seoDescription: "Safety-first checks for common angle grinder operating issues.", summary: "Safety-first checks for common angle grinder operating issues.", category: "Buyer Guides", content: "<h1>Angle Grinder Troubleshooting, Maintenance and Safety Checks</h1><p>Stop using a tool that will not start, makes abnormal noise, overheats, vibrates excessively, runs at an unstable speed or has a damaged switch, cable or battery.</p><h2>Safe checks</h2><ul><li>Disconnect the power source before inspection.</li><li>Check the disc, guard and mounting hardware for visible damage and correct installation.</li><li>Use only the disc type and speed rating specified for the tool.</li><li>Do not attempt live electrical repair or bypass protection devices.</li></ul><h2>When to seek professional repair</h2><p>Internal electrical faults, repeated tripping, unusual heat, damaged cables or battery concerns require qualified service. This guide is general safety information, not a substitute for the model manual or trained repair personnel.</p>" },
    { ...base, id: "blog-brushless-wall-chaser-selection-guide", slug: "brushless-wall-chaser-selection-guide", title: "How to Choose a Brushless Wall Chaser | Cowin Supply", seoTitle: "How to Choose a Brushless Wall Chaser | Cowin Supply", seoDescription: "A sourcing guide for selecting wall chasers for concrete and masonry work.", summary: "A sourcing guide for wall chasers used in concrete and masonry work.", category: "Buyer Guides", content: "<h1>How to Select a Brushless Wall Chaser for Concrete and Masonry</h1><p>Wall chaser selection should be based on material, local power supply and the verified capability of the selected model.</p><h2>Selection points</h2><ul><li>Confirm the cutting material, blade diameter, cutting width and cutting depth from model-specific documentation.</li><li>Keep rated power and maximum power separate; do not compare unsupported headline figures.</li><li>Plan dust extraction or water-cutting controls according to site rules and the tool manual.</li><li>Review voltage, frequency, protection features and tool weight for the target market.</li></ul><h2>OEM and wholesale checklist</h2><p>Confirm packaging, documentation, accessories, private-label requirements and sample evaluation with the selected supply source before order approval.</p><h2>Related Cowin Supply products</h2><p>See the current wall chaser listings and request verified specifications for the chosen model.</p>" }
  ];
}
