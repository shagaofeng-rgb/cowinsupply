import fs from "node:fs/promises";
import crypto from "node:crypto";

const keyPath = process.argv[2];
const command = process.argv[3] || "list-sites";
const siteUrl = process.argv[4];
const targetUrl = process.argv[5];

const scope = "https://www.googleapis.com/auth/webmasters";

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

async function getAccessToken() {
  const key = JSON.parse(await fs.readFile(keyPath, "utf8"));
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: key.client_email,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(key.private_key, "base64url");
  const assertion = `${unsigned}.${signature}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Token request failed: ${data.error || response.status}`);
  }
  return data.access_token;
}

async function googleFetch(path, options = {}) {
  const token = await getAccessToken();
  const response = await fetch(`https://www.googleapis.com/webmasters/v3${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    throw new Error(JSON.stringify({ status: response.status, data }));
  }
  return data;
}

if (!keyPath) {
  throw new Error("Usage: node tools/google-search-console.mjs <service-account-json> <command> [siteUrl] [targetUrl]");
}

if (command === "list-sites") {
  console.log(JSON.stringify(await googleFetch("/sites"), null, 2));
} else if (command === "submit-sitemap") {
  if (!siteUrl || !targetUrl) throw new Error("submit-sitemap requires siteUrl and sitemapUrl");
  const path = `/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(targetUrl)}`;
  await googleFetch(path, { method: "PUT" });
  console.log(JSON.stringify({ submitted: true, siteUrl, sitemapUrl: targetUrl }, null, 2));
} else if (command === "list-sitemaps") {
  if (!siteUrl) throw new Error("list-sitemaps requires siteUrl");
  const path = `/sites/${encodeURIComponent(siteUrl)}/sitemaps`;
  console.log(JSON.stringify(await googleFetch(path), null, 2));
} else {
  throw new Error(`Unknown command: ${command}`);
}
