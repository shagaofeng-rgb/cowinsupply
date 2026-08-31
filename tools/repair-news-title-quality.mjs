import { getPersistentValue, hasPersistentStore, setPersistentValue } from "../lib/persistentStore.js";
import { newsSeoTitle } from "../lib/newsReliability.js";

const TITLE_REPAIR_VERSION = "news-title-quality-v1";
const titleBySlug = new Map([
  ["2026-08-30-buyer-briefing-kft-k190-2800w-ac-brushless-wall-slotting-machine-for-material-c", "KFT-K190 Wall Slotting Machine Buyer Briefing"],
  ["metro-mayors-given-power-to-override-councils-on-big-schemes-what-it-means-for-constructio", "UK Metro Planning Powers: Construction Tool Workflow Context"],
  ["construction-update-a-practical-view-for-kft-q450-800w-ac-brushless-jig-saw-buyers-4", "California High-Speed Rail Funding: Tool Buyer Context"],
  ["construction-update-a-practical-view-for-kft-q450-800w-ac-brushless-jig-saw-buyers-3", "Skanska DBE Changes: Contractor Tool Supply Context"],
  ["construction-update-a-practical-view-for-kft-q450-800w-ac-brushless-jig-saw-buyers-2", "Construction Backlog Decline: Procurement Context for Tool Buyers"],
  ["construction-update-a-practical-view-for-kft-q450-800w-ac-brushless-jig-saw-buyers", "Data Center Planning Momentum: Jobsite Tool Buyer Context"],
  ["construction-update-a-practical-view-for-3-in-1-laser-measuring-tape-40m-60m-listing-buyer", "Construction Leadership Changes: Measuring Tool Buyer Context"]
]);

if (!hasPersistentStore()) throw new Error("Production persistence is required for the News title repair.");

const current = await getPersistentValue("cms-items");
if (!Array.isArray(current) || !current.length) throw new Error("cms-items is empty or unavailable.");

let backup = await getPersistentValue(`${TITLE_REPAIR_VERSION}-backup`);
if (!backup) {
  backup = {
    createdAt: new Date().toISOString(),
    items: current.filter((item) => titleBySlug.has(item?.slug))
  };
  await setPersistentValue(`${TITLE_REPAIR_VERSION}-backup`, {
    ...backup
  });
}

const changed = [];
const updatedAt = new Date().toISOString();
const originalBySlug = new Map((backup.items || []).map((item) => [item.slug, item]));
const next = current.map((item) => {
  const title = titleBySlug.get(item?.slug);
  if (!title || item.type !== "news" || item.status !== "published") return item;
  const seoTitle = newsSeoTitle(title);
  const original = originalBySlug.get(item.slug);
  const sourceTitle = original?.sourceTitle ?? item.sourceTitle;
  if (item.title === title && item.seoTitle === seoTitle && item.sourceTitle === sourceTitle) return item;
  changed.push({ slug: item.slug, title });
  return {
    ...item,
    title,
    seoTitle,
    sourceTitle,
    updatedAt
  };
});

await setPersistentValue("cms-items", next);
await setPersistentValue(TITLE_REPAIR_VERSION, { appliedAt: updatedAt, changed: changed.map((item) => item.slug) });

console.log(JSON.stringify({ version: TITLE_REPAIR_VERSION, changedCount: changed.length, changed }, null, 2));
