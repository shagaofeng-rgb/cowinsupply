import assert from "node:assert/strict";
import test from "node:test";
import { countCandidateReasons, cronPublicationSucceeded, NEWS_POLICY_VERSION, publicationHttpStatus } from "../lib/newsReliability.js";

test("reports the exact reasons that block or defer publication", () => {
  assert.deepEqual(countCandidateReasons([
    { rejectionReasons: ["duplicate_source_url", "missing_image"], availabilityReasons: [] },
    { rejectionReasons: ["duplicate_source_url"], availabilityReasons: ["source_age_fallback_window"] }
  ]), {
    duplicate_source_url: 2,
    missing_image: 1,
    source_age_fallback_window: 1
  });
});

test("cron is healthy only after a publication or a verified same-day limit", () => {
  assert.equal(cronPublicationSucceeded({ publish: { publishResult: { published: true } } }), true);
  assert.equal(cronPublicationSucceeded({ publish: { reason: "daily_publish_limit_reached" } }), true);
  assert.equal(publicationHttpStatus({ publish: { publishResult: { published: false }, reason: "all_current_candidates_blocked_by_quality_gates" } }), 503);
});

test("uses the reliable daily publication policy version", () => {
  assert.equal(NEWS_POLICY_VERSION, "v5");
});
