"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "数据总览" },
  { href: "/admin/traffic", label: "流量分析" },
  { href: "/admin/seo-data", label: "SEO 数据" },
  { href: "/admin/products", label: "产品管理" },
  { href: "/admin/news", label: "新闻管理" },
  { href: "/admin/blog", label: "Blog 管理" },
  { href: "/admin/links", label: "内外链审计" },
  { href: "/admin/inquiries", label: "客户表单" },
  { href: "/admin/visitors", label: "访客记录" },
  { href: "/admin/pages", label: "页面表现" },
  { href: "/admin/paths", label: "访问路径" },
  { href: "/admin/sync", label: "数据同步" },
  { href: "/admin/settings", label: "系统设置" }
];

export default function AdminShell({ children, email }) {
  const pathname = usePathname();

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <Link className="admin-logo" href="/admin">
          <Image className="admin-brand-mark" src="/cowin-assets/cowin-logo.png" alt="Cowin Supply logo" width={38} height={38} priority />
          <strong>网站数据后台</strong>
        </Link>
        <nav>
          {links.map((link) => (
            <Link className={pathname === link.href ? "is-active" : ""} href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <strong>数据由已连接服务同步</strong>
          <small>请在对应模块查看实时统计与同步状态</small>
          <small>当前账号</small>
          <span>{email}</span>
          <form action="/api/admin/logout" method="post">
            <button type="submit">退出登录</button>
          </form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
