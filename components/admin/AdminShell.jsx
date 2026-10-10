"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconActivity, IconArticle, IconBook2, IconCategory, IconChartBar, IconChartDots3,
  IconChevronRight, IconDatabase, IconDeviceDesktopAnalytics, IconFileSearch,
  IconFileText, IconHome2, IconLink, IconListDetails, IconLogout, IconMail,
  IconMenu2, IconPhoto, IconRoute, IconSettings, IconShieldLock, IconUsers,
  IconX
} from "@tabler/icons-react";

const groups = [
  { title: "概览", links: [{ href: "/admin", label: "数据总览", icon: IconHome2 }] },
  { title: "客户与访客", links: [
    { href: "/admin/inquiries", label: "客户表单", icon: IconMail },
    { href: "/admin/visitors", label: "访客记录", icon: IconUsers },
    { href: "/admin/paths", label: "访问路径", icon: IconRoute }
  ] },
  { title: "内容管理", links: [
    { href: "/admin/products", label: "产品管理", icon: IconCategory },
    { href: "/admin/news", label: "新闻管理", icon: IconFileText },
    { href: "/admin/blog", label: "Blog 管理", icon: IconArticle },
    { href: "/admin/categories", label: "分类管理", icon: IconListDetails },
    { href: "/admin/media", label: "媒体素材", icon: IconPhoto }
  ] },
  { title: "流量与 SEO", links: [
    { href: "/admin/traffic", label: "流量分析", icon: IconChartBar },
    { href: "/admin/pages", label: "页面表现", icon: IconDeviceDesktopAnalytics },
    { href: "/admin/seo-data", label: "SEO 数据", icon: IconChartDots3 },
    { href: "/admin/seo", label: "SEO 设置", icon: IconFileSearch },
    { href: "/admin/links", label: "内外链清单", icon: IconLink }
  ] },
  { title: "运营与设置", links: [
    { href: "/admin/sync", label: "数据同步", icon: IconDatabase },
    { href: "/admin/settings", label: "系统设置", icon: IconSettings },
    { href: "/admin/system", label: "系统状态", icon: IconActivity },
    { href: "/admin/audit", label: "操作日志", icon: IconBook2 },
    { href: "/admin/users", label: "账号权限", icon: IconShieldLock }
  ] }
];

export default function AdminShell({ children, email }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <div className="admin-dashboard admin-v2">
      {menuOpen ? <button className="admin-nav-backdrop" type="button" aria-label="关闭导航" onClick={() => setMenuOpen(false)} /> : null}
      <aside className={`admin-sidebar ${menuOpen ? "is-open" : ""}`} aria-label="后台导航">
        <div className="admin-sidebar-top">
          <Link className="admin-logo" href="/admin" onClick={() => setMenuOpen(false)} aria-label="Cowin Supply 后台首页">
            <strong>COWIN<span>SUPPLY</span></strong>
            <small>管理后台</small>
          </Link>
          <button className="admin-nav-close" type="button" aria-label="关闭导航" onClick={() => setMenuOpen(false)}><IconX size={22} /></button>
        </div>
        <nav aria-label="主导航">
          {groups.map((group) => (
            <div className="admin-nav-group" key={group.title}>
              <span className="admin-nav-heading">{group.title}</span>
              {group.links.map(({ href, label, icon: Icon }) => {
                const active = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
                return <Link className={active ? "is-active" : ""} aria-current={active ? "page" : undefined} href={href} key={href} onClick={() => setMenuOpen(false)}>
                  <Icon size={20} stroke={1.9} aria-hidden="true" /><span>{label}</span>{active ? <IconChevronRight className="admin-nav-chevron" size={16} aria-hidden="true" /> : null}
                </Link>;
              })}
            </div>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <span>当前账号</span>
          <strong>{email}</strong>
          <form action="/api/admin/logout" method="post"><button type="submit"><IconLogout size={18} aria-hidden="true" />退出登录</button></form>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <button className="admin-nav-toggle" type="button" aria-label="打开导航" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><IconMenu2 size={22} /></button>
          <strong>CowinSupply 管理后台</strong>
          <span className="admin-topbar-account">{email}</span>
        </header>
        <main id="admin-main" className="admin-main">{children}</main>
      </div>
    </div>
  );
}
