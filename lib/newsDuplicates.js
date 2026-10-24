// Keep the oldest URL as the stable canonical for verbatim repeat publications.
// Different articles that merely share a title must remain separate.
export function canonicalNewsBySlug(items = []) {
  const canonical = new Map();
  const groups = new Map();
  for (const item of items) {
    const title = String(item?.title || "").trim().toLowerCase();
    const content = String(item?.content || "").trim();
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

export function uniqueNews(items = []) {
  const canonical = canonicalNewsBySlug(items);
  return items.filter((item) => !canonical.has(item.slug) || canonical.get(item.slug) === item.slug);
}

function publicationTime(item) {
  const time = Date.parse(item?.publishedAt || item?.createdAt || "");
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
}
