"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "数据总览" },
  { href: "/admin/traffic", label: "流量分析" },
  { href: "/admin/seo-data", label: "SEO 数据" },
  { href: "/admin/products", label: "产品管理" },
  { href: "/admin/news", label: "新闻管理" },
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
          <span>CY</span>
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
          <strong>半小时自动同步 0 PV / 0 询盘</strong>
          <small>最近同步：{new Date().toLocaleTimeString("zh-CN")}</small>
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
