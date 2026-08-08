export const PRODUCT_TAXONOMY = [
  { slug: "wall-chasers-concrete-cutting", name: "Wall Chasers & Concrete Cutting", description: "Industrial tools for controlled wall slotting, core drilling and concrete cutting work." },
  { slug: "wall-chasers", parent: "wall-chasers-concrete-cutting", name: "Wall Chasers", description: "Wall chasers for planned cable and pipe channels in masonry and concrete work." },
  { slug: "wall-slotting-machines", parent: "wall-chasers-concrete-cutting", name: "Wall Slotting Machines", description: "Wall slotting machines for electrical-installation and renovation applications." },
  { slug: "core-drills", parent: "wall-chasers-concrete-cutting", name: "Core Drills", description: "Core drilling equipment for specified construction and installation work." },
  { slug: "concrete-cutting-tools", parent: "wall-chasers-concrete-cutting", name: "Concrete Cutting Tools", description: "Concrete cutting tools selected around the target material and verified cutting requirement." },
  { slug: "cutting-tools", name: "Cutting Tools", description: "Professional cutting tools for material-specific workshop and site tasks." },
  { slug: "angle-grinders", parent: "cutting-tools", name: "Angle Grinders", description: "Angle grinders for metal, stone and general preparation work." },
  { slug: "jig-saws-curve-saws", parent: "cutting-tools", name: "Jig Saws & Curve Saws", description: "Jig saws and curve saws for controlled cutting applications." },
  { slug: "cold-cutting-saws", parent: "cutting-tools", name: "Cold Cutting Saws", description: "Cold cutting saws for material-specific workshop cutting operations." },
  { slug: "drilling-tools", name: "Drilling Tools", description: "Drilling equipment for construction, installation and workshop sourcing." },
  { slug: "cordless-drills", parent: "drilling-tools", name: "Cordless Drills", description: "Cordless drills for trade, installation and workshop tasks." },
  { slug: "annular-cutters-magnetic-drills", parent: "drilling-tools", name: "Annular Cutters / Magnetic Drills", description: "Annular cutting and magnetic drilling solutions for defined hole-making applications." },
  { slug: "surface-finishing-tools", name: "Surface Finishing Tools", description: "Surface-finishing tools for wall preparation and renovation work." },
  { slug: "wall-polishing-machines", parent: "surface-finishing-tools", name: "Wall Polishing Machines", description: "Wall polishing machines for sanding, leveling and surface preparation." },
  { slug: "measuring-tools", name: "Measuring Tools", description: "Laser and digital measuring tools for layout and site measurement." },
  { slug: "laser-distance-meters", parent: "measuring-tools", name: "Laser Distance Meters", description: "Handheld laser distance meters for checked jobsite measurements." },
  { slug: "laser-measuring-tapes", parent: "measuring-tools", name: "Laser Measuring Tapes", description: "Laser measuring tapes that combine tape and distance-measurement functions." },
  { slug: "precision-tools", name: "Precision Tools", description: "Compact precision tools for controlled repair and assembly work." },
  { slug: "electric-screwdrivers", parent: "precision-tools", name: "Electric Screwdrivers", description: "Electric screwdrivers for electronics, repair and light assembly tasks." }
];

export const LEGACY_CATEGORY_REDIRECTS = {
  "brushless-angle-grinders": "/products/angle-grinders",
  "cordless-power-tools": "/products/cordless-drills",
  "brushless-saws": "/products/jig-saws-curve-saws",
  "laser-measuring-tools": "/products/measuring-tools",
  "specialty-tools": "/products/wall-polishing-machines"
};

const bySlug = new Map(PRODUCT_TAXONOMY.map((item) => [item.slug, item]));
export function getTaxonomyItem(slug) { return bySlug.get(String(slug || "")) || null; }
export function categoryPath(slug) {
  const item = getTaxonomyItem(slug);
  if (!item) return [];
  return item.parent ? [getTaxonomyItem(item.parent), item].filter(Boolean) : [item];
}

export function classifyProduct(item) {
  const text = `${item.slug || ""} ${item.title || ""} ${(item.tags || []).join(" ")}`.toLowerCase();
  if (/laser.*tape|measuringtapewith/.test(text)) return "laser-measuring-tapes";
  if (/laser|distance calculator|distance meter/.test(text)) return "laser-distance-meters";
  if (/screwdriver/.test(text)) return "electric-screwdrivers";
  if (/wall polish|wall sander|wall grinding/.test(text)) return "wall-polishing-machines";
  if (/water drilling|core drill/.test(text)) return "core-drills";
  if (/annular|magnetic drill/.test(text)) return "annular-cutters-magnetic-drills";
  if (/cordless.*drill|lithium.*drill/.test(text)) return "cordless-drills";
  if (/jig saw|curve saw/.test(text)) return "jig-saws-curve-saws";
  if (/cold cut/.test(text)) return "cold-cutting-saws";
  if (/angle grinder/.test(text)) return "angle-grinders";
  if (/wall slot|wall chas|wall groov/.test(text)) return "wall-chasers";
  return "cutting-tools";
}

export function productCategoryName(item) { return getTaxonomyItem(item.categorySlug || classifyProduct(item))?.name || "Power Tools"; }

const PRODUCT_NORMALIZATION = {
  "KFT-Q450BrushlessJigSaw": { title: "KFT-Q450 800W AC Brushless Jig Saw", model: "KFT-Q450" },
  "6000wsolttingmachine": { title: "AC Brushless Wall Chaser (6000W Listing)" },
  HeavyCuttingMachine: { title: "AC Brushless Wall Chaser (5500W Listing)" },
  CuttingMachine: { title: "KFT-K190 AC Brushless Wall Slotting Machine (2800W)", model: "KFT-K190", duplicateModelRecord: true },
  LaserMeasuringDevicwithMultiFunction: { title: "Handheld Laser Distance Meter" },
  MeasuringTapewithDigitalDisplay: { title: "3-in-1 Laser Measuring Tape (40m/60m Listing)" },
  ScrewdriverforElectronics: { title: "Handheld Precision Electric Screwdriver" },
  RechargeableBrushlessAngleGrinder: { title: "Rechargeable Brushless Angle Grinder" },
  BrushlessLithiumIonCordlessDrill: { title: "Brushless Lithium-Ion Cordless Drill" },
  BrushlessLithium: { title: "Cordless Brushless Lithium Battery Drill" },
  ACBrushlesscurvesaw: { title: "AC Brushless Curve Saw" },
  ACBrushlesswallpolishingmachine: { title: "KFT-W215 AC Brushless Wall Polishing Machine", model: "KFT-W215" },
  ACBrushlesscoldcuttingsaw: { title: "AC Brushless Cold Cutting Saw" },
  brushlessannularcutter: { title: "KFT-Y370 Brushless Annular Cutter", model: "KFT-Y370" },
  ACBrushlesswaterdrillingrig: { title: "KFT-S218 AC Brushless Water Drilling Rig", model: "KFT-S218" },
  "40": { title: "KFT-K190 AC Brushless Wall Slotting Machine (Historical Record)", model: "KFT-K190", duplicateModelRecord: true },
  BrushlessAngleGrinde: { title: "KRT-A125B Brushless Angle Grinder", model: "KRT-A125B" },
  BrushlessAngleGrinder: { title: "KRT-A125 Brushless Angle Grinder", model: "KRT-A125" }
};

export function normalizeProductCatalogRecord(item) {
  const normalized = PRODUCT_NORMALIZATION[item.slug] || {};
  const categorySlug = classifyProduct(item);
  const category = getTaxonomyItem(categorySlug)?.name || "Power Tools";
  const title = normalized.title || String(item.title || "Product").replace(/[\uFFFD]|\s+Ltd\.?$/gi, "").trim();
  return {
    ...item,
    title,
    model: normalized.model || item.model || "",
    category,
    categorySlug,
    duplicateModelRecord: Boolean(normalized.duplicateModelRecord),
    parameterStatus: "pending-confirmation",
    seoIndexable: false,
    seoTitle: `${title} | Cowin Supply`,
    seoDescription: `${title} for B2B sourcing. Confirm the current configuration, voltage, accessories and product specifications with Cowin Supply.`,
    geoSummary: `${title} is listed for professional buyers evaluating a product for the stated application. Request the current model-specific documentation before quotation or order approval.`
  };
}
