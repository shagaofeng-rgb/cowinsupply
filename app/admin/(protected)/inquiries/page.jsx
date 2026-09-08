import AdminListControls from "@/components/admin/AdminListControls";
import InquiryWorkspace from "@/components/admin/InquiryWorkspace";
import Pagination from "@/components/admin/Pagination";
import RangeBox from "@/components/admin/RangeBox";
import { getAdminDateRange } from "@/lib/adminDateRange";
import { getInquiriesPage } from "@/lib/cmsStore";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statuses = [
  { value: "new", label: "新线索" },
  { value: "contacted", label: "已联系" },
  { value: "quoted", label: "报价中" },
  { value: "closed", label: "已成交" },
  { value: "invalid", label: "无效线索" },
  { value: "archived", label: "已归档" }
];

export default async function AdminInquiriesPage({ searchParams }) {
  const params = await searchParams;
  const range = getAdminDateRange(params);
  const result = await getInquiriesPage({ ...params, ...range });

  return <>
    <header className="admin-page-head lead-page-head">
      <div>
        <small>客户线索</small>
        <h1>询盘工作台</h1>
        <p>集中查看客户需求、来源、浏览路径、邮件通知与跟进状态。</p>
      </div>
      <div className="admin-head-actions"><RangeBox /><Link className="admin-button" href="/api/admin/inquiries/export">导出 CSV</Link></div>
    </header>
    <AdminListControls action="/admin/inquiries" keyword={params?.q} status={params?.status} pageSize={result.pageSize} statusOptions={statuses} range={range} />
    <InquiryWorkspace items={result.items} />
    <Pagination basePath="/admin/inquiries" page={result.page} pageSize={result.pageSize} total={result.total} query={params} />
  </>;
}
