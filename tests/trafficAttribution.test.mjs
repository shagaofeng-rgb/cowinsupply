import assert from "node:assert/strict";
import test from "node:test";
import { detectTrafficSource } from "../lib/trafficAttribution.js";

test("keeps a session's original acquisition source instead of an internal click", () => {
  assert.equal(detectTrafficSource({ referrer: "https://www.google.com/search?q=tools" }), "搜索");
  assert.equal(detectTrafficSource({ referrer: "" }), "直接访问");
  assert.equal(detectTrafficSource({ referrer: "https://www.cowinsupply.com/product" }), "站内");
});

test("classifies campaign tags without substring false positives", () => {
  assert.equal(detectTrafficSource({ referrer: "", utmSource: "google", utmMedium: "cpc" }), "付费广告");
  assert.equal(detectTrafficSource({ referrer: "", utmSource: "linkedin" }), "社媒");
  assert.equal(detectTrafficSource({ referrer: "", utmMedium: "email" }), "邮件");
  assert.equal(detectTrafficSource({ referrer: "https://notgoogle.com/" }), "外部链接");
});
