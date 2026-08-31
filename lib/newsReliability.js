import { compactText, seoTitleFor } from "./contentQuality.js";

export const NEWS_POLICY_VERSION = "v5";

export function compactNewsTitle(value, maxLength = 78) {
  return compactText(value, maxLength);
}

export function newsSeoTitle(title, maxLength = 70) {
  return seoTitleFor(title, maxLength);
}

export function countCandidateReasons(candidates = []) {
  const counts = {};
  for (const candidate of candidates) {
    for (const reason of [...(candidate?.rejectionReasons || []), ...(candidate?.availabilityReasons || [])]) {
      counts[reason] = (counts[reason] || 0) + 1;
    }
  }
  return Object.fromEntries(Object.entries(counts).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])));
}

export function cronPublicationSucceeded(run) {
  const publish = run?.publish || {};
  return Boolean(publish.publishResult?.published || publish.reason === "daily_publish_limit_reached");
}

export function publicationHttpStatus(run) {
  return cronPublicationSucceeded(run) ? 200 : 503;
}
