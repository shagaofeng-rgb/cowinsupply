import AdminListControls from "@/components/admin/AdminListControls";
import InquiryWorkspace from "@/components/admin/InquiryWorkspace";
import Pagination from "@/components/admin/Pagination";
import { getInquiries, paginateItems } from "@/lib/cmsStore";
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
  const result = paginateItems(await getInquiries(), params);

  return <>
    <header className="admin-page-head lead-page-head">
      <div>
        <small>客户线索</small>
        <h1>询盘工作台</h1>
        <p>集中查看客户需求、来源、浏览路径、邮件通知与跟进状态。</p>
      </div>
      <Link className="admin-button" href="/api/admin/inquiries/export">导出 CSV</Link>
    </header>
    <AdminListControls action="/admin/inquiries" keyword={params?.q} status={params?.status} pageSize={result.pageSize} statusOptions={statuses} />
    <InquiryWorkspace items={result.items} />
    <Pagination basePath="/admin/inquiries" page={result.page} pageSize={result.pageSize} total={result.total} query={params} />
  </>;
}
