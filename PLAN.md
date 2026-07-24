# Cowin Supply 中文管理后台实施计划

## News Automation Delivery Status (2026-07-24)

- Architecture: Next.js route handlers, Neon PostgreSQL persistent storage, Vercel Cron, and the authenticated admin console.
- Sources: public RSS feeds only, with allowlist/blacklist controls, timeouts, private-network SSRF blocking, and no login or paywall bypass.
- Publication: four-article daily target, `Asia/Shanghai` accounting, 72-hour source-time validation, seven-day URL/title/event deduplication, a persistent concurrency lock, audit records, and email shortfall alerts.
- Product relation: each automatic article must resolve to one to three public products. The relation is persisted on the article, exposed through the product-news API, shown on the News page, and surfaced back on matching product pages.
- SEO/GEO: server-rendered list/detail pages, canonical metadata, Open Graph/Twitter tags, `NewsArticle` and `BreadcrumbList` JSON-LD, RSS, standard XML Sitemap, Google News Sitemap, and robots discovery.
- Operations: four Vercel Cron windows per day, sitemap refresh after publication, authenticated retry controls, and production health checks.
- Validation: `npm run test:news`, `npm run build`, production API/list/detail/feed/sitemap checks, then Vercel production deployment.

## 当前状态

- 项目：Cowin Supply 官网与中文管理后台。
- 框架：Next.js App Router，部署目标为 Vercel。
- 已有生产域名：www.cowinsupply.com。
- 已有后台模块：数据总览、产品管理、新闻管理、询盘记录、操作日志。
- 已有表单能力：官网询盘提交、SMTP 邮件通知、后台询盘查看。

## 本次执行范围

1. 修复后台中文乱码和损坏标签。
2. 完善产品、新闻、询盘列表的搜索、状态筛选、分页和空状态。
3. 增加询盘状态更新、CSV 导出、操作日志。
4. 增加公开内容 API，便于前台、SEO 和后续同步使用。
5. 增加健康检查接口、部署文档和环境变量样例。
6. 构建验证后部署到 Vercel 生产环境。
7. 按网站数据后台模型新增数据总览、流量分析、SEO 数据、内外链审计、访客记录、页面表现、访问路径和数据同步。
8. 接入前台访问采集 API `/api/track`，后台所有访问分析模块读取真实采集事件；外部 GSC/GA 未配置时显示未配置或暂无数据，不使用伪造搜索数据。

## 架构

- 前台页面：Next.js 路由与静态资源。
- 后台页面：`/admin` 下的服务端渲染页面，登录后访问。
- 后台 API：`/api/admin/*`，需要管理员会话。
- 公开 API：`/api/content/*`，只返回已发布内容。
- 表单 API：`/api/inquiry`，保存询盘并发送管理员通知邮件。
- 访问采集 API：`/api/track`，前台页面通过 Beacon 写入真实访问事件。

## 数据设计

当前项目使用 `lib/cmsStore.js` 的文件型数据层：

- 内容数据：产品、新闻。
- 询盘数据：客户表单提交。
- 操作日志：登录、内容管理、询盘处理、导出。

生产数据层已接入 Neon PostgreSQL。`cmsStore` 保持统一接口，生产环境读写数据库；本地未配置数据库时才使用 `.data` 文件回退。

## 安全

- 管理后台使用 HttpOnly Cookie 会话。
- 管理员账号通过环境变量配置。
- 后台 API 强制校验管理员会话。
- 敏感环境变量不提交到代码仓库。
- 仍需补充：持久化登录限流、账号锁定、角色权限、审计日志数据库存储。

## 测试与验收

- 本地执行 `npm run build`。
- 部署后检查：
  - `/api/health`
  - `/admin/login`
  - `/api/content/products`
  - `/api/content/news`
  - 未登录访问 `/api/admin/summary` 应返回 401。
- 登录后台后检查：
  - 数据总览
  - 产品管理
  - 新闻管理
  - 询盘记录
  - 操作日志
  - CSV 导出

## 后续建议

1. 增加后台用户、角色、权限和登录限流表。
2. 增加媒体库和对象存储。
3. 增加备份、恢复、导入导出和操作日志留存策略。

## 新闻自动发布执行状态

- 数据库：生产环境使用 Vercel Marketplace 的 Neon PostgreSQL，CMS、询盘、新闻任务、发布审计和 Sitemap 运行记录均通过统一持久化存储读写。
- 数据来源：仅使用管理员在 `NEWS_SOURCE_FEEDS` 中配置的公开 RSS；支持来源白名单、黑名单、72 小时窗口、语言和产品相关性校验。
- 发布规则：每日目标默认 4 篇，Cron 在四个时间窗口执行；采用 PostgreSQL 互斥锁，避免并发重复发布。
- 去重：使用规范化来源 URL、来源指纹、事件指纹和标准化标题，限制连续 7 天内重复引用。
- 内容：仅保存来源事实摘要和 Cowin Supply 独立 B2B 分析，保留来源链接、原始发布时间、真实产品关联、SEO/GEO 字段和 `NewsArticle` 结构化数据。
- 发布后：刷新动态 Sitemap；每日 Sitemap Cron 再提交至 Google Search Console。RSS 仅输出已持久化发布的文章。
- 风险：若合法公开 RSS 在 72 小时窗口内没有足够的高相关候选内容，系统会记录缺口而非虚构文章；需在后台补充可信来源或人工审核发布。
