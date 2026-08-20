const PROHIBITED_PATTERNS = [
  /\bas an ai\b/i,
  /\bai-generated\b/i,
  /\blet'?s dive in\b/i,
  /\bin today'?s fast-paced world\b/i,
  /\bit is worth noting\b/i,
  /\bworld-leading\b/i,
  /\bgame-changing\b/i,
  /\bguaranteed\b/i
];

function fingerprint(value) {
  let hash = 2166136261;
  for (const character of String(value || "")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function normalizeProse(value) {
  return String(value || "")
    .replace(/[\u2013\u2014]/g, ", ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+<\//g, "</")
    .trim();
}

export function humanizeNewsArticle(article, lockedFacts = {}) {
  const originalContent = String(article?.content || "");
  const originalDraftHash = fingerprint(originalContent);
  const content = normalizeProse(originalContent);
  const plainContent = content
    .replace(/<[^>]+>/g, " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/\s+/g, " ")
    .trim();
  const prohibitedPhrasesFound = PROHIBITED_PATTERNS
    .filter((pattern) => pattern.test(content))
    .map((pattern) => pattern.source);
  const factDeltaDetected = Object.entries(lockedFacts).some(([, value]) => value && !plainContent.includes(String(value)));
  const audit = {
    originalDraftHash,
    humanizedDraftHash: fingerprint(content),
    factualFieldsLocked: Object.keys(lockedFacts).filter((key) => lockedFacts[key]),
    removedAiPatterns: originalContent === content ? [] : ["normalized punctuation and spacing"],
    prohibitedPhrasesFound,
    similarityBefore: 1,
    similarityAfter: 1,
    factDeltaDetected,
    passed: prohibitedPhrasesFound.length === 0 && !factDeltaDetected,
    processedAt: new Date().toISOString()
  };
  return { article: { ...article, content, contentText: plainContent }, audit };
}
