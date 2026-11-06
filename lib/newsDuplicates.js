// Keep the oldest URL as the stable canonical for verbatim repeat publications.
// Different articles that merely share a title must remain separate.
const titleKey = item => String(item?.title || "").trim().toLowerCase();
const contentKey = item => String(item?.content || "").trim();

export function canonicalNewsBySlug(items = [], bodyKey = contentKey) {
  const canonical = new Map();
  const groups = new Map();
  for (const item of items) {
    const title = titleKey(item);
    const content = bodyKey(item);
    if (!item?.slug || !title || !content) continue;
    const key = JSON.stringify([title, content]);
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => publicationTime(a) - publicationTime(b) || a.slug.localeCompare(b.slug));
    for (const item of group) canonical.set(item.slug, group[0].slug);
  }
  return canonical;
}

export function uniqueNews(items = [], bodyKey) {
  const canonical = canonicalNewsBySlug(items, bodyKey);
  return items.filter((item) => !canonical.has(item.slug) || canonical.get(item.slug) === item.slug);
}

// A missing comparison key is harmless when the title has no peer.
export function hasAmbiguousNewsBodyKeys(items) {
  const titles = new Map();
  for (const item of items) {
    const title = titleKey(item);
    if (!item?.slug || !title) continue;
    const prior = titles.get(title);
    const unknownBody = item.storefrontBodyKey == null;
    if (prior !== undefined && (prior || unknownBody)) return true;
    titles.set(title, unknownBody);
  }
  return false;
}

function publicationTime(item) {
  const time = Date.parse(item?.publishedAt || item?.createdAt || "");
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
}
