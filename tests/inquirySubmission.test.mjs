import assert from "node:assert/strict";
import test from "node:test";
import { inquirySubmissionId } from "../lib/inquirySubmission.js";

test("a retried inquiry uses the same ID but changed business fields remain distinct", () => {
  const key = "88b1ad48-c810-4448-b09e-507c2a5ddd5a";
  const details = { email: "buyer@example.com", productModel: "KFT-K230", estimatedQuantity: "20", message: "Please quote." };
  const first = inquirySubmissionId(key, details);
  assert.ok(first);
  assert.equal(inquirySubmissionId(key, { ...details, email: " BUYER@example.com ", referrer: "https://other.example/" }), first);
  assert.notEqual(inquirySubmissionId(key, { ...details, estimatedQuantity: "40" }), first);
  assert.notEqual(inquirySubmissionId(key, { ...details, email: "second@example.com" }), first);
  assert.equal(inquirySubmissionId("invalid", details), null);
});
