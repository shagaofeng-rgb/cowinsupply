const DEFAULT_SITE_ID = "cowinsupply-primary";

const SITE_CONFIGS = {
  [DEFAULT_SITE_ID]: {
    siteId: DEFAULT_SITE_ID,
    enabled: true,
    brandName: "Cowin Supply",
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.cowinsupply.com").replace(/\/$/, ""),
    industry: "industrial power tools",
    industryScope: "Professional cutting, slotting, drilling, grinding, surface finishing and measuring tools for distributors, contractors and trade buyers.",
    targetMarkets: ["global"],
    publicationLanguage: "en",
    locale: "en-US",
    timezone: process.env.NEWS_AUTOMATION_TIMEZONE || "Asia/Shanghai",
    news: {
      enabled: process.env.NEWS_AUTOMATION_ENABLED !== "false" && process.env.NEWS_AUTO_PUBLISH !== "false",
      listRoute: "/news",
      detailRoutePattern: "/news/[slug]",
      rssRoute: "/news/rss.xml",
      sitemapRoute: "/news-sitemap.xml",
      ingestIntervalHours: 12,
      publishIntervalHours: 24,
      candidateMaxAgeHours: 72,
      fallbackCandidateMaxAgeDays: 7,
      minScore: 70,
      maxInternalProductLinks: 1
    },
    blog: {
      enabled: true,
      listRoute: "/blog",
      detailRoutePattern: "/blog/[slug]",
      sitemapRoute: "/sitemap-blog.xml",
      allowNewsAutomation: false
    },
    productThemePlan: { sourceType: "cms_collection", sourceReference: "cms-items:product" },
    sources: {
      primaryWhitelist: ["source-catalog"],
      fallbackWhitelist: ["source-catalog"]
    },
    publishing: { requireFrontendVerification: true, productionEnabled: process.env.NEWS_AUTOMATION_ENABLED !== "false" && process.env.NEWS_AUTO_PUBLISH !== "false" }
  }
};

export function getNewsSiteConfig(siteId = DEFAULT_SITE_ID) {
  const config = SITE_CONFIGS[siteId];
  if (!config) throw new Error(`Unknown News site_id: ${siteId}`);
  return structuredClone(config);
}

export function validateNewsSiteConfig(config) {
  const missing = [];
  for (const field of ["siteId", "brandName", "siteUrl", "industry", "industryScope", "publicationLanguage", "timezone"]) {
    if (!config?.[field]) missing.push(field);
  }
  for (const field of ["listRoute", "detailRoutePattern", "candidateMaxAgeHours", "publishIntervalHours"]) {
    if (config?.news?.[field] === undefined || config?.news?.[field] === "") missing.push(`news.${field}`);
  }
  if (!config?.sources?.primaryWhitelist?.length) missing.push("sources.primaryWhitelist");
  if (!config?.sources?.fallbackWhitelist?.length) missing.push("sources.fallbackWhitelist");
  return { valid: missing.length === 0, missing };
}

export { DEFAULT_SITE_ID };
