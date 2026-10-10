import Image from "next/image";
import Link from "next/link";
import { IconChevronRight, IconEye, IconMail, IconNews, IconPackage, IconSettings, IconUsers } from "@tabler/icons-react";
import { DataTable, MetricCard, SyncStrip } from "@/components/admin/DataPanels";
import RangeBox from "@/components/admin/RangeBox";
import TrafficTrend from "@/components/admin/TrafficTrend";
import { getAdminDateRange } from "@/lib/adminDateRange";
import { getAnalyticsReport, getCmsItems, getInquiriesPage, getSyncStatus } from "@/lib/cmsStore";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({ searchParams }) {
  const range = getAdminDateRange(await searchParams);
  const [analytics, products, news, inquiries, sync] = await Promise.all([
    getAnalyticsReport(range),
    getCmsItems("product", { includeInactive: true }),
    getCmsItems("news", { includeInactive: true }),
    getInquiriesPage({ ...range, page: 1, pageSize: 10 }),
    getSyncStatus()
  ]);
  const publishedProducts = products.filter((item) => item.status === "published").length;
  const publishedNews = news.filter((item) => item.status === "published").length;
  const rangeHref = (path) => `${path}?${new URLSearchParams({ range: range.range, from: range.from, to: range.to })}`;

  return (
    <>
      <header className="data-hero dashboard-hero">
        <div>
          <small>运营概览</small>
          <h1>数据总览</h1>
          <p>查看网站访问、客户询盘与内容发布情况。访问和询盘按所选时间统计，内容数量为当前已发布总数。</p>
        </div>
        <RangeBox />
      </header>

      <SyncStrip sync={sync} />

      <section className="metric-grid dashboard-metrics" aria-label="核心业务指标">
        <MetricCard label="页面浏览量 (PV)" value={analytics.reliable ? analytics.pv : null} hint="所选时间 · 访问事件" icon={IconEye} href={rangeHref("/admin/traffic")} />
        <MetricCard label="独立访客 (UV)" value={analytics.reliable ? analytics.uv : null} hint="所选时间 · 访客标识去重" icon={IconUsers} href={rangeHref("/admin/visitors")} />
        <MetricCard label="客户询盘数" value={analytics.reliable ? analytics.inquiries : null} hint="所选时间 · 表单记录" icon={IconMail} href={rangeHref("/admin/inquiries")} />
        <MetricCard label="已发布产品" value={publishedProducts} hint="当前内容 · 不随时间筛选" icon={IconPackage} href="/admin/products" />
        <MetricCard label="已发布新闻" value={publishedNews} hint="当前内容 · 不随时间筛选" icon={IconNews} href="/admin/news" />
      </section>

      <section className="dashboard-main-grid">
        <DataTable
          title="最新客户询盘"
          href={rangeHref("/admin/inquiries")}
          columns={["收到时间", "客户", "邮箱", "状态", "操作"]}
          rows={(analytics.reliable ? inquiries.items : []).slice(0, 5).map((item) => ({ id: item.id, cells: [
            new Date(item.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false }),
            item.name || "未留姓名", item.email || "未留邮箱", inquiryStatus(item.status),
            <Link key={item.id} href={`/admin/inquiries/${encodeURIComponent(item.id)}`}>查看详情</Link>
          ] }))}
          empty="所选时间范围暂无客户询盘。"
        />
        <TrafficTrend series={analytics.reliable ? analytics.daily : []} range={range} title="页面浏览趋势" />
      </section>

      <section className="data-grid-two dashboard-secondary-grid">
        <DataTable title="热门页面" href={rangeHref("/admin/pages")} columns={["页面", "PV"]} rows={analytics.reliable ? analytics.topPages.slice(0, 5).map((item) => ({ id: item.key, cells: [item.key, item.count] })) : []} empty="所选时间范围暂无可靠的页面访问记录。" />
        <DataTable title="主要访问来源" href={rangeHref("/admin/traffic")} columns={["来源", "访问量"]} rows={analytics.reliable ? analytics.sources.slice(0, 5).map((item) => ({ id: item.key, cells: [item.key, item.count] })) : []} empty="所选时间范围暂无可靠的来源记录。" />
      </section>
      <section className="dashboard-lower-grid">
        <div className="dashboard-brand-panel">
          <Image src="/cowin-assets/home-v1-hero.webp" alt="Cowin Supply 专业电动工具产品" fill sizes="(max-width: 980px) 100vw, 65vw" loading="eager" />
          <div><small>COWIN SUPPLY</small><strong>专业电动工具 · 全球供应</strong><span>稳定供货，服务全球采购伙伴</span></div>
        </div>
        <div className="data-panel dashboard-quick-actions"><h2>常用入口</h2><div>
          <Link href={rangeHref("/admin/inquiries")}><IconMail size={19} aria-hidden="true" />查看客户询盘<IconChevronRight size={16} aria-hidden="true" /></Link>
          <Link href="/admin/products"><IconPackage size={19} aria-hidden="true" />管理产品<IconChevronRight size={16} aria-hidden="true" /></Link>
          <Link href="/admin/news"><IconNews size={19} aria-hidden="true" />管理新闻<IconChevronRight size={16} aria-hidden="true" /></Link>
          <Link href="/admin/settings"><IconSettings size={19} aria-hidden="true" />系统设置<IconChevronRight size={16} aria-hidden="true" /></Link>
        </div></div>
      </section>
      <p className="admin-data-footnote">访问统计来源：站内访问事件；当前覆盖：{analytics.coverage}。询盘来源：后台表单记录。访问事件不等同于经过机器人过滤的真人会话。</p>
    </>
  );
}

function inquiryStatus(status) {
  return ({ new: "新线索", contacted: "已联系", quoted: "报价中", closed: "已成交", invalid: "无效线索", archived: "已归档" })[status] || "状态未知";
}
