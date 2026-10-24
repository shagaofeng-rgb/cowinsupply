import assert from "node:assert/strict";
import test from "node:test";
import { canonicalNewsBySlug, uniqueNews } from "../lib/newsDuplicates.js";

test("only verbatim repeated News uses the oldest stable URL", () => {
  const items = [
    { slug: "repeat-2", title: "Product Update", content: "Same verified text", publishedAt: "2026-10-02" },
    { slug: "repeat", title: "Product Update", content: "Same verified text", publishedAt: "2026-10-01" },
    { slug: "new-update", title: "Product Update", content: "Different facts", publishedAt: "2026-10-03" }
  ];
  assert.equal(canonicalNewsBySlug(items).get("repeat-2"), "repeat");
  assert.deepEqual(uniqueNews(items).map((item) => item.slug), ["repeat", "new-update"]);
});
