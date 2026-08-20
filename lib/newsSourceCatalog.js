import sourceCatalog from "@/data/news/source-catalog.seed.json";

const DISCOVERY_ONLY = new Set(["discovery-only"]);

function trustLevelFor(tier) {
  return tier === "A" ? "high" : tier === "B" ? "medium" : "unverified";
}

export function getNewsSourceCatalog() {
  return sourceCatalog.map((source) => ({ ...source }));
}

export function getCatalogSource(sourceId) {
  return getNewsSourceCatalog().find((source) => source.id === sourceId) || null;
}

export function isCatalogSourceEligible(source) {
  return Boolean(
    source &&
      !DISCOVERY_ONLY.has(source.tier) &&
      source.active === true &&
      source.robotsAllowed === true &&
      source.rssUrl &&
      /^https:\/\//.test(source.rssUrl)
  );
}

export function toRuntimeSource(source) {
  return {
    id: source.id,
    publisher: source.name,
    domain: source.domain,
    sourceGroup: source.sourceGroup,
    rssUrl: source.rssUrl || "",
    type: source.tier === "A" ? "first_party_or_authoritative" : "industry_media",
    trustLevel: source.trustLevel || trustLevelFor(source.tier),
    language: "en",
    enabled: isCatalogSourceEligible(source),
    catalogVerified: source.active === true && source.robotsAllowed === true,
    licenseNote: "Source text is used only for factual verification and linked attribution. No external editorial image is copied."
  };
}

export function getEligibleCatalogSources() {
  return getNewsSourceCatalog().filter(isCatalogSourceEligible).map(toRuntimeSource);
}

export function getNewsSourceCatalogSummary() {
  const sources = getNewsSourceCatalog();
  return {
    total: sources.length,
    groups: [...new Set(sources.map((source) => source.sourceGroup))].length,
    discoveryOnly: sources.filter((source) => DISCOVERY_ONLY.has(source.tier)).length,
    eligible: sources.filter(isCatalogSourceEligible).length,
    inactive: sources.filter((source) => !source.active).length
  };
}
