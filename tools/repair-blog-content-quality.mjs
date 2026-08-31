import { getPersistentValue, hasPersistentStore, setPersistentValue } from "../lib/persistentStore.js";
import { normalizeCowinArticleLinks, seoTitleFor } from "../lib/contentQuality.js";

const VERSION = "blog-content-quality-v1";
if (!hasPersistentStore()) throw new Error("Production persistence is required for the Blog quality repair.");

const current = await getPersistentValue("cms-items");
if (!Array.isArray(current) || !current.length) throw new Error("cms-items is empty or unavailable.");

const candidates = current.filter((item) => {
  if (item?.type !== "blog" || item?.status !== "published") return false;
  const normalizedContent = normalizeCowinArticleLinks(item.content || "");
  return normalizedContent !== String(item.content || "") || String(item.seoTitle || item.title || "").length > 90;
});

if (!(await getPersistentValue(`${VERSION}-backup`))) {
  await setPersistentValue(`${VERSION}-backup`, { createdAt: new Date().toISOString(), items: candidates });
}

const changed = [];
const updatedAt = new Date().toISOString();
const candidateSlugs = new Set(candidates.map((item) => item.slug));
const next = current.map((item) => {
  if (!candidateSlugs.has(item?.slug)) return item;
  const content = normalizeCowinArticleLinks(item.content || "");
  const previousSeoTitle = String(item.seoTitle || item.title || "");
  const seoTitle = previousSeoTitle.length > 90 ? seoTitleFor(item.title) : item.seoTitle;
  if (content === item.content && seoTitle === item.seoTitle) return item;
  changed.push({ slug: item.slug, linksNormalized: content !== item.content, seoTitleCompacted: seoTitle !== item.seoTitle });
  return { ...item, content, seoTitle, updatedAt };
});

await setPersistentValue("cms-items", next);
await setPersistentValue(VERSION, { appliedAt: updatedAt, changed });
console.log(JSON.stringify({ version: VERSION, changedCount: changed.length, changed }, null, 2));
