import crypto from "node:crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API_ROOT = "https://searchconsole.googleapis.com/webmasters/v3/sites";
const SCOPE = "https://www.googleapis.com/auth/webmasters";

export function isGoogleSeoConfigured() {
  return Boolean(getServiceAccount()?.client_email && getServiceAccount()?.private_key);
}

export async function fetchGoogleSeoData({ siteUrl = process.env.GSC_SITE_URL || "sc-domain:cowinsupply.com" } = {}) {
  const account = getServiceAccount();
  if (!account?.client_email || !account?.private_key) {
    return { configured: false, connected: false, error: "not-configured" };
  }

  try {
    const token = await createAccessToken(account);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 28);

    const baseBody = {
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      rowLimit: 25
    };

    const [queryRows, pageRows, countryRows] = await Promise.all([
      searchAnalytics(token, siteUrl, { ...baseBody, dimensions: ["query"] }),
      searchAnalytics(token, siteUrl, { ...baseBody, dimensions: ["page"] }),
      searchAnalytics(token, siteUrl, { ...baseBody, dimensions: ["country"] })
    ]);

    const totals = [...queryRows, ...pageRows].reduce(
      (acc, row) => ({
        clicks: acc.clicks + Number(row.clicks || 0),
        impressions: acc.impressions + Number(row.impressions || 0),
        positionSum: acc.positionSum + Number(row.position || 0),
        positionCount: acc.positionCount + 1
      }),
      { clicks: 0, impressions: 0, positionSum: 0, positionCount: 0 }
    );

    const clicks = totals.clicks;
    const impressions = totals.impressions;
    const ctr = impressions ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
    const position = totals.positionCount ? Number((totals.positionSum / totals.positionCount).toFixed(1)) : 0;

    return {
      configured: true,
      connected: true,
      siteUrl,
      clicks,
      impressions,
      ctr,
      position,
      keywords: queryRows.map(toKeyword),
      landingPages: pageRows.map(toLandingPage),
      markets: countryRows.map(toMarket),
      updatedAt: new Date().toISOString(),
      error: null
    };
  } catch (error) {
    return {
      configured: true,
      connected: false,
      siteUrl,
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
      keywords: [],
      landingPages: [],
      markets: [],
      updatedAt: new Date().toISOString(),
      error: sanitizeError(error)
    };
  }
}

export async function submitSitemapToGoogle({ siteUrl, sitemapUrl } = {}) {
  const account = getServiceAccount();
  if (!account?.client_email || !account?.private_key) {
    return { attempted: true, success: false, skipped: true, reason: "not-configured" };
  }
  if (!siteUrl || !sitemapUrl) {
    return { attempted: true, success: false, skipped: true, reason: "missing-site-or-sitemap-url" };
  }

  try {
    const token = await createAccessToken(account);
    const response = await fetch(`${API_ROOT}/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`, {
      method: "PUT",
      headers: { authorization: `Bearer ${token}` }
    });
    const text = await response.text();
    if (!response.ok) {
      let error = text;
      try {
        error = JSON.parse(text)?.error?.message || text;
      } catch {
        // Keep raw API text when Google returns non-JSON.
      }
      return { attempted: true, success: false, skipped: false, siteUrl, sitemapUrl, status: response.status, error: sanitizeError(error) };
    }
    return { attempted: true, success: true, skipped: false, siteUrl, sitemapUrl, status: response.status || 204, submittedAt: new Date().toISOString() };
  } catch (error) {
    return { attempted: true, success: false, skipped: false, siteUrl, sitemapUrl, error: sanitizeError(error) };
  }
}

function getServiceAccount() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) {
    try {
      return JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64, "base64").toString("utf8"));
    } catch {
      return null;
    }
  }
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } catch {
      return null;
    }
  }
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replaceAll("\\n", "\n")
    };
  }
  return null;
}

async function createAccessToken(account) {
  const now = Math.floor(Date.now() / 1000);
  const assertion = signJwt(
    { alg: "RS256", typ: "JWT" },
    {
      iss: account.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now
    },
    account.private_key
  );

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || `token-${response.status}`);
  }
  return data.access_token;
}

async function searchAnalytics(token, siteUrl, body) {
  const response = await fetch(`${API_ROOT}/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `search-console-${response.status}`);
  }
  return data.rows || [];
}

function signJwt(header, payload, privateKey) {
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(privateKey, "base64url");
  return `${unsigned}.${signature}`;
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function toKeyword(row) {
  return {
    query: row.keys?.[0] || "",
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: Number(((row.ctr || 0) * 100).toFixed(2)),
    position: Number((row.position || 0).toFixed(1))
  };
}

function toLandingPage(row) {
  return {
    page: row.keys?.[0] || "",
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: Number(((row.ctr || 0) * 100).toFixed(2)),
    position: Number((row.position || 0).toFixed(1))
  };
}

function toMarket(row) {
  return {
    country: row.keys?.[0] || "unknown",
    clicks: row.clicks || 0,
    impressions: row.impressions || 0
  };
}

function sanitizeError(error) {
  const message = String(error?.message || error || "unknown-error");
  if (/permission|not a verified owner|insufficient/i.test(message)) return "service-account-no-search-console-permission";
  if (/ENOTFOUND|fetch failed|timeout|ECONN/i.test(message)) return "google-api-network-error";
  return message.slice(0, 180);
}
