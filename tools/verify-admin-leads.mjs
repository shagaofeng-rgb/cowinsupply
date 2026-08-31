import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.ADMIN_VERIFY_URL || "http://127.0.0.1:3081";
const visitorId = `lead-verification-${crypto.randomUUID()}`;
const sessionId = `lead-session-${crypto.randomUUID()}`;

const response = await fetch(`${baseUrl}/api/track`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    path: "/__internal-admin-verification__",
    title: "Internal admin verification",
    visitorId,
    sessionId,
    language: "en-US",
    screen: "1440x900"
  })
});
const body = await response.json();
assert.equal(response.status, 200, `tracking endpoint failed: ${JSON.stringify(body)}`);
assert.equal(body.success, true, `tracking did not return success: ${JSON.stringify(body)}`);
assert.ok(body.data?.id, "tracking response did not include an event id");

const unauthorized = await fetch(`${baseUrl}/api/admin/inquiries/not-a-real-id`);
assert.equal(unauthorized.status, 401, "inquiry detail API must require an admin session");

const adminEmail = process.env.ADMIN_VERIFY_EMAIL || process.env.ADMIN_EMAIL || "";
const adminPassword = process.env.ADMIN_VERIFY_PASSWORD || process.env.ADMIN_PASSWORD || "";
assert.ok(adminEmail && adminPassword, "ADMIN_VERIFY_EMAIL and ADMIN_VERIFY_PASSWORD are required for admin verification");
const loginForm = new URLSearchParams({ email: adminEmail, password: adminPassword });
const login = await fetch(`${baseUrl}/api/admin/login`, { method: "POST", body: loginForm, redirect: "manual" });
assert.equal(login.status, 303, "local admin login failed");
const cookie = login.headers.getSetCookie?.().at(0) || login.headers.get("set-cookie");
assert.ok(cookie, "admin login did not set a session cookie");
const inquiriesPage = await fetch(`${baseUrl}/admin/inquiries`, { headers: { cookie } });
const inquiriesHtml = await inquiriesPage.text();
assert.equal(inquiriesPage.status, 200, "inquiry workspace did not render");
assert.match(inquiriesHtml, /询盘工作台/, "inquiry workspace title is missing");
assert.match(inquiriesHtml, /点击任意线索可在右侧展开完整信息/, "inquiry detail drawer guidance is missing");

const inquiryPath = path.join(process.cwd(), ".data", "inquiries.json");
try {
  const inquiries = JSON.parse(await fs.readFile(inquiryPath, "utf8"));
  if (inquiries[0]?.id) {
    const detail = await fetch(`${baseUrl}/api/admin/inquiries/${encodeURIComponent(inquiries[0].id)}`, { headers: { cookie } });
    const detailBody = await detail.json();
    assert.equal(detail.status, 200, "authenticated inquiry detail request failed");
    assert.equal(detailBody.success, true, "inquiry detail response was not successful");
    assert.equal(detailBody.data.inquiry.id, inquiries[0].id, "inquiry detail returned the wrong record");
  }
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const eventPath = path.join(process.cwd(), ".data", "visit-events.json");
const events = JSON.parse(await fs.readFile(eventPath, "utf8"));
assert.ok(events.some((event) => event.id === body.data.id && event.visitorId === visitorId), "tracking event was not persisted");
await fs.writeFile(eventPath, JSON.stringify(events.filter((event) => event.id !== body.data.id), null, 2), "utf8");

console.log("admin-leads verification passed: tracking persisted, admin detail API is protected, and the inquiry workspace rendered");
