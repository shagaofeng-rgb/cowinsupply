import { requireAdminApi } from "@/lib/adminApi";
import { appendAuditLog, getInquiries } from "@/lib/cmsStore";

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
  ["utmSource", "UTM Source"],
  ["utmMedium", "UTM Medium"],
  ["utmCampaign", "UTM Campaign"]
];

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const inquiries = await getInquiries();
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
  return `"${String(value).replaceAll('"', '""')}"`;
}
