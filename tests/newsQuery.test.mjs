import assert from "node:assert/strict";
import test from "node:test";
import { filterNews, paginateNews } from "../lib/newsQuery.js";

const items = [
  { title: "Cutting saw supply update", category: "Industry News", sourcePublisher: "Tool News", language: "en", publishedAt: new Date().toISOString(), primaryKeyword: "cold cutting saw", secondaryKeywords: ["construction"], relatedProducts: [{ productSlug: "cold-saw", productTitle: "Cold Saw" }] },
  { title: "Workshop maintenance", category: "Maintenance", sourcePublisher: "Factory Press", language: "en", publishedAt: "2020-01-01T00:00:00.000Z", primaryKeyword: "drill", secondaryKeywords: ["maintenance"], relatedProducts: [{ productSlug: "drill", productTitle: "Drill" }] }
];

test("filters News by source, related product and time period", () => {
  assert.equal(filterNews(items, { source: "tool news", product: "cold-saw", period: "day" }).length, 1);
  assert.equal(filterNews(items, { tag: "maintenance", period: "week" }).length, 0);
});

test("paginates with a bounded page number", () => {
  const result = paginateNews(items, { page: 99, pageSize: 6 });
  assert.deepEqual({ page: result.page, pageCount: result.pageCount, total: result.total }, { page: 1, pageCount: 1, total: 2 });
});
