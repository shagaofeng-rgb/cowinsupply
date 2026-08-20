import test from "node:test";
import assert from "node:assert/strict";
import { getNewsSiteConfig, validateNewsSiteConfig } from "../lib/newsSiteConfig.js";

test("CowinSupply News configuration is complete and keeps Blog automation disabled", () => {
  const site = getNewsSiteConfig();
  assert.equal(validateNewsSiteConfig(site).valid, true);
  assert.equal(site.news.ingestIntervalHours, 12);
  assert.equal(site.news.publishIntervalHours, 24);
  assert.equal(site.news.maxInternalProductLinks, 1);
  assert.equal(site.blog.allowNewsAutomation, false);
});

test("unknown site ids fail closed", () => {
  assert.throws(() => getNewsSiteConfig("other-site"), /Unknown News site_id/);
});
