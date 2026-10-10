import assert from "node:assert/strict";
import test from "node:test";
import { getAdminDateRange, getAdminRangeLabel } from "../lib/adminDateRange.js";

const today = "2026-10-10";

test("admin ranges use Shanghai calendar dates and a Monday-start week", () => {
  assert.deepEqual(getAdminDateRange({ range: "day" }, today), { range: "day", from: today, to: today });
  assert.deepEqual(getAdminDateRange({ range: "week" }, today), { range: "week", from: "2026-10-05", to: today });
  assert.deepEqual(getAdminDateRange({ range: "month" }, today), { range: "month", from: "2026-10-01", to: today });
  assert.deepEqual(getAdminDateRange({ range: "ninety" }, today), { range: "ninety", from: "2026-07-13", to: today });
  assert.deepEqual(getAdminDateRange({ range: "week" }, "2026-10-11"), { range: "week", from: "2026-10-05", to: "2026-10-11" });
});

test("custom range keeps valid dates and rejects future or reversed dates", () => {
  assert.deepEqual(getAdminDateRange({ range: "custom", from: "2026-09-01", to: "2026-09-20" }, today), { range: "custom", from: "2026-09-01", to: "2026-09-20" });
  assert.equal(getAdminDateRange({ range: "custom", from: "2026-09-20", to: "2026-09-01" }, today).range, "day");
  assert.equal(getAdminDateRange({ range: "custom", from: "2026-10-10", to: "2026-10-11" }, today).range, "day");
  assert.equal(getAdminRangeLabel({ range: "week", from: "2026-10-05", to: today }), "本周，2026-10-05 至 2026-10-10");
});
