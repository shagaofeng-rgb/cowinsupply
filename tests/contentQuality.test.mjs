import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCowinArticleLinks, normalizeCowinInternalHref, seoTitleFor } from "../lib/contentQuality.js";

test("normalizes legacy Cowin links without changing external or contact links", () => {
  assert.equal(normalizeCowinInternalHref("www.cowinsupply.com/products"), "/product");
  assert.equal(normalizeCowinInternalHref("https://www.cowinsupply.com/contact-us"), "/contact");
  assert.equal(normalizeCowinInternalHref("/products/electric-wall-chasers"), "/products/wall-chasers");
  assert.equal(normalizeCowinInternalHref("mailto:sales@cowinsupply.com"), "mailto:sales@cowinsupply.com");
  assert.equal(normalizeCowinInternalHref("https://example.com/products"), "https://example.com/products");
  assert.equal(normalizeCowinArticleLinks('<a href="www.cowinsupply.com/angle-grinders">Tools</a>'), '<a href="/products/angle-grinders">Tools</a>');
});

test("creates concise SEO titles at word boundaries", () => {
  const value = seoTitleFor("Evaluating Reliability in Brushless Chainsaw Manufacturers for Industrial Use");
  assert.ok(value.length <= 70);
  assert.ok(value.endsWith(" | Cowin Supply"));
  assert.ok(!value.includes("Manufactur…"));
});
