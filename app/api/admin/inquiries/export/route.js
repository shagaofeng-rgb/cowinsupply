import { requireAdminApi } from "@/lib/adminApi";
import { appendAuditLog, getInquiries } from "@/lib/cmsStore";
import { getAdminDateRange } from "@/lib/adminDateRange";

const columns = [
  ["createdAt", "提交时间"],
  ["status", "状态"],
  ["name", "姓名"],
  ["company", "公司"],
  ["email", "邮箱"],
  ["phone", "电话"],
  ["country", "国家"],
  ["product", "产品"],
  ["message", "留言"],
  ["pageUrl", "来源页面"],
  ["landingPage", "落地页"],
  ["referrer", "引荐来源"],
  ["utmSource", "UTM Source"],
  ["utmMedium", "UTM Medium"],
  ["utmCampaign", "UTM Campaign"],
  ["utmTerm", "UTM Term"],
  ["utmContent", "UTM Content"],
  ["visitorCountry", "访问国家/地区"],
  ["browserLanguage", "浏览器语言"],
  ["timezone", "访客时区"],
  ["screen", "屏幕尺寸"],
  ["visitorId", "访客ID"],
  ["sessionId", "会话ID"]
];

export async function GET(request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const params = new URL(request.url).searchParams;
  const filtered = params.has("range") || params.has("from") || params.has("q") || params.has("status");
  const range = filtered ? getAdminDateRange(Object.fromEntries(params.entries())) : null;
  const keyword = String(params.get("q") || "").trim().toLowerCase();
  const status = String(params.get("status") || "").trim();
  const inquiries = (await getInquiries()).filter((item) => {
    const day = shanghaiDate(item.createdAt);
    const text = [item.name, item.company, item.email, item.phone, item.product, item.message, item.country].join(" ").toLowerCase();
    return (!range || (day >= range.from && day <= range.to)) && (!status || item.status === status) && (!keyword || text.includes(keyword));
  });
  const rows = [
    columns.map(([, label]) => csvCell(label)).join(","),
    ...inquiries.map((item) => columns.map(([key]) => csvCell(item[key] || "")).join(","))
  ];

  await appendAuditLog({ action: "export_csv", module: "inquiry", target: `${inquiries.length} rows` });

  return new Response(`\uFEFF${rows.join("\n")}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="cowinsupply-inquiries-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}

function csvCell(value) {
  const text = String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

function shanghaiDate(value) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  const date = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${date.year}-${date.month}-${date.day}`;
}
