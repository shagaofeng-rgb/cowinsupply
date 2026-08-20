import assert from "node:assert/strict";
import test from "node:test";
import { humanizeNewsArticle } from "../lib/newsHumanizer.js";

test("News humanizer preserves locked facts while normalizing typography", () => {
  const result = humanizeNewsArticle({ content: "<p>Tool update — KFT-Q450 is relevant.</p>" }, { productTitle: "KFT-Q450" });
  assert.equal(result.audit.passed, true);
  assert.equal(result.audit.factDeltaDetected, false);
  assert.doesNotMatch(result.article.content, /[\u2013\u2014]/);
});

test("News humanizer rejects prohibited publishing language", () => {
  const result = humanizeNewsArticle({ content: "<p>As an AI, this is a guaranteed result.</p>" });
  assert.equal(result.audit.passed, false);
  assert.equal(result.audit.prohibitedPhrasesFound.length, 2);
});
