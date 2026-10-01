import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getNewsSiteConfig, validateNewsSiteConfig } from "../lib/newsSiteConfig.js";

test("News automation is disabled while independent Blog publishing stays enabled", () => {
  const site = getNewsSiteConfig();
  assert.equal(validateNewsSiteConfig(site).valid, true);
  assert.equal(site.news.ingestIntervalHours, 12);
  assert.equal(site.news.publishIntervalHours, 24);
  assert.equal(site.news.maxInternalProductLinks, 1);
  assert.equal(site.news.rssRoute, "/news/rss.xml");
  assert.equal(site.blog.allowNewsAutomation, false);
  assert.equal(site.blog.enabled, true);
  assert.equal(site.news.enabled, false);
  assert.equal(site.publishing.productionEnabled, false);
});

test("News cron is removed and Google submission is Monday noon Shanghai", () => {
  const { crons } = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.equal(crons.some(job => job.path.startsWith('/api/cron/news')), false);
  assert.equal(crons.find(job => job.path === '/api/cron/google-sitemap-submit').schedule, '0 4 * * 1');
});

test("unknown site ids fail closed", () => {
  assert.throws(() => getNewsSiteConfig("other-site"), /Unknown News site_id/);
});

test("disabled ingest and publication exit before external services", async () => {
  // Remove service imports: any service access would fail this offline test.
  const source = fs.readFileSync(new URL('../lib/newsAutomationV2.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '');
  const setup = `const DEFAULT_SITE_ID='cowinsupply-primary'; const NEWS_POLICY_VERSION='v5'; const getEligibleCatalogSources=()=>[]; const getNewsSiteConfig=()=>(${JSON.stringify(getNewsSiteConfig())});\n`;
  const automation = await import('data:text/javascript;base64,' + Buffer.from(setup + source).toString('base64'));
  for (const run of [automation.runNewsIngest, automation.runNewsPublication]) {
    const result = await run();
    assert.equal(result.status, 'skipped');
    assert.equal(result.reason, 'automation_disabled');
  }
});
