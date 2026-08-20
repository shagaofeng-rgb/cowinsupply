import topicProfiles from "@/data/products/topic-profiles.json";

const profilesById = new Map(topicProfiles.map((profile) => [profile.productId, profile]));

export function getNewsProductProfile(product) {
  return profilesById.get(product?.id) || null;
}

export function canUseProductForAutomatedNews(product) {
  const profile = getNewsProductProfile(product);
  return Boolean(profile && profile.approvedFactSources?.length && profile.prohibitedClaims?.length === 0);
}
