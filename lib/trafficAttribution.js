const SEARCH_HOSTS = ["google.", "bing.com", "yahoo.", "duckduckgo.com", "baidu.com", "yandex."];
const SOCIAL_HOSTS = ["facebook.com", "instagram.com", "linkedin.com", "youtube.com", "x.com", "twitter.com", "tiktok.com"];

export function detectTrafficSource({ referrer = "", utmSource = "", utmMedium = "" } = {}) {
  const medium = String(utmMedium).trim().toLowerCase();
  const campaignSource = String(utmSource).trim().toLowerCase();
  if (/^(cpc|ppc|paid|paidsearch|display|ad|ads)$/.test(medium)) return "付费广告";
  if (/^(email|newsletter)$/.test(medium)) return "邮件";
  if (/^(social|social-media|organic-social)$/.test(medium)) return "社媒";
  if (campaignSource) {
    if (["google", "bing", "yahoo", "duckduckgo", "baidu", "yandex"].includes(campaignSource) || isKnownHost(campaignSource, SEARCH_HOSTS)) return "搜索";
    if (["facebook", "instagram", "linkedin", "youtube", "x", "twitter", "tiktok"].includes(campaignSource) || isKnownHost(campaignSource, SOCIAL_HOSTS)) return "社媒";
    return "推广渠道";
  }

  let host = "";
  try { host = new URL(String(referrer)).hostname.toLowerCase().replace(/^www\./, ""); } catch { /* Missing referrer is common. */ }
  if (!host) return "直接访问";
  if (host === "cowinsupply.com" || host.endsWith(".cowinsupply.com")) return "站内";
  if (isKnownHost(host, SEARCH_HOSTS)) return "搜索";
  if (isKnownHost(host, SOCIAL_HOSTS)) return "社媒";
  return "外部链接";
}

function isKnownHost(value, hosts) {
  return hosts.some((host) => host.endsWith(".") ? value.startsWith(host) : value === host || value.endsWith(`.${host}`));
}
