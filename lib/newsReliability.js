export const NEWS_POLICY_VERSION = "v5";

export function compactNewsTitle(value, maxLength = 78) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  const raw = text.slice(0, Math.max(1, maxLength - 1));
  const boundary = raw.lastIndexOf(" ");
  const safe = boundary >= Math.floor(maxLength * 0.65) ? raw.slice(0, boundary) : raw;
  return `${safe.replace(/[,:;\-\s]+$/g, "")}…`;
}

export function newsSeoTitle(title, maxLength = 70) {
  const suffix = " | Cowin Supply";
  return `${compactNewsTitle(title, maxLength - suffix.length)}${suffix}`;
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
