import assert from "node:assert/strict";
import test from "node:test";
import { articlePageTitle, normalizeCowinArticleLinks, normalizeCowinInternalHref, seoTitleFor } from "../lib/contentQuality.js";

test("normalizes legacy Cowin links without changing external or contact links", () => {
  assert.equal(normalizeCowinInternalHref("www.cowinsupply.com/products"), "/product");
  assert.equal(normalizeCowinInternalHref("https://www.cowinsupply.com/contact-us"), "/contact");
  assert.equal(normalizeCowinInternalHref("/products/electric-wall-chasers"), "/products/wall-chasers");
  assert.equal(normalizeCowinInternalHref("mailto:sales@cowinsupply.com"), "mailto:info@cowinsupply.com");
  assert.equal(normalizeCowinInternalHref("https://example.com/products"), "https://example.com/products");
  assert.equal(normalizeCowinInternalHref("/measuring-tools"), "/products/measuring-tools");
  assert.equal(normalizeCowinInternalHref("/products/laser-tape-measures"), "/products/laser-measuring-tapes");
  assert.equal(normalizeCowinInternalHref("/products/brushless-chainsaws"), "/product");
  assert.equal(normalizeCowinInternalHref("/customization-services"), "/contact#quote");
  assert.equal(normalizeCowinInternalHref("info@cowinsupply.com"), "mailto:info@cowinsupply.com");
  assert.equal(normalizeCowinInternalHref("%5Bwww.cowinsupply.com/angle-grinders%5D(www.cowinsupply.com/angle-grinders)"), "/products/angle-grinders");
  assert.equal(normalizeCowinArticleLinks('<a href="www.cowinsupply.com/angle-grinders">Tools</a>'), '<a href="/products/angle-grinders">Tools</a>');
});

test("creates concise SEO titles at word boundaries", () => {
  const value = seoTitleFor("Evaluating Reliability in Brushless Chainsaw Manufacturers for Industrial Use");
  assert.ok(value.length <= 70);
  assert.ok(value.endsWith(" | Cowin Supply"));
  assert.ok(!value.includes("Manufactur…"));
});

test("Blog search titles distinguish headlines with the same clipped prefix and preserve editorial titles", () => {
  const first = "Evaluating Laser Tape Measure Manufacturers for Industrial Precision";
  const second = "Evaluating Laser Tape Measure Manufacturers for Industrial Reliability";
  const seoTitle = seoTitleFor(first);
  assert.equal(seoTitle, seoTitleFor(second));
  assert.equal(articlePageTitle({ title: first, seoTitle }), first);
  assert.equal(articlePageTitle({ title: second, seoTitle }), second);
  const alternate = "Industrial Laser Tape Measures: Accuracy and Durability Checklist";
  assert.equal(articlePageTitle({ title: second, seoTitle }, alternate), alternate);
  assert.equal(articlePageTitle({ title: second, seoTitle: "Laser Tape Measure Selection | Cowin Supply" }, alternate), "Laser Tape Measure Selection | Cowin Supply");
});
