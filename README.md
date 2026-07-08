# Cowin Supply Website

Cowin Supply 官网与中文管理后台，基于 Next.js 部署到 Vercel。

## 本地运行

```bash
npm install
npm run dev
```

默认本地地址：

```text
http://127.0.0.1:3000
```

## 构建

```bash
npm run build
```

## 管理后台

后台入口：

```text
/admin/login
```

当前模块：

- 数据总览
- 产品管理
- 新闻管理
- 询盘记录
- 操作日志

## 环境变量

请参考 `.env.example`。生产环境必须在 Vercel Project Settings 中配置真实值。

关键变量：

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` 或 `ADMIN_PASSWORD_HASH`
- `ADMIN_JWT_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `ADMIN_NOTIFICATION_EMAIL`

## 数据存储说明

当前版本的数据读写集中在 `lib/cmsStore.js`。本地使用 `.data` 目录，Vercel Serverless 环境会使用临时目录，因此不适合作为长期生产数据库。

要达到生产级中文管理后台要求，请接入 PostgreSQL 或等价持久数据库，并把 `cmsStore` 替换为数据库实现。

## 部署

```bash
npx vercel deploy --prod --yes --scope davidsha
```

## 验收接口

- `/api/health`
- `/api/content/products`
- `/api/content/news`
- `/api/content/sitemap`
- `/api/admin/summary` 未登录应返回 401

## 安全提示

不要把 `.env.local`、SMTP 密码、服务账号 JSON 或后台密码提交到仓库。
