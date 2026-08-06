# Full-Site Content, SEO and Publishing Control Report

Date: 2026-08-06, Asia/Shanghai
Production: https://www.cowinsupply.com
Final deployment: `dpl_GiFWqzZHCPEbRMW1inoN2ds3pCYG` (READY)

## Confirmed working

- Vercel production deployment is READY and aliases include `www.cowinsupply.com` and `cowinsupply.com`.
- The persistent CMS is configured as a Neon/Postgres-backed key/value store when production database variables are present.
- Public News, Blog and product routes read CMS records, not fixture-only page arrays.
- `robots.txt`, sitemap index, category sitemap and `llms.txt` are available in production.
- Product category route `/products/wall-chasers` returns HTTP 200.
- Legacy tag handling is enforced before public static files: a relevant tag returns 301; an unknown tag returns 410.

## Completed remediation

- One-time cleanup policy removed the specified webhook test Blog, matching template News records and named legacy thin News records after a public backup export.
- The deleted webhook test Blog returns HTTP 410 in production.
- News automation now collects source-backed drafts with `pending_review`; it cannot publish public News or refresh the public sitemap.
- Blog webhook accepts only an authenticated short verification request. Full article payloads are refused and cannot create a public Blog post.
- Sitemap eligibility excludes drafts, non-indexable content, tags and products without specification rows.
- Added canonical legacy HTML redirects, six product category URLs, a disallow policy for admin/API/tag routes, an `llms.txt` statement and basic inquiry anti-bot/field-length checks.

## Test evidence

| Check | Result |
| --- | --- |
| `npm run test:news` | 2/2 passed |
| `npm run build` | passed |
| `/blog/cowin-supply-blog-webhook-production-verification` | HTTP 410 |
| `/products/wall-chasers` | HTTP 200 |
| `/tag/Wall%20Chaser` | HTTP 301 to `/products/wall-chasers` |
| `/tag/obsolete-term` | HTTP 410 |
| `/robots.txt`, `/sitemap.xml`, `/sitemaps/sitemap-categories.xml`, `/llms.txt` | HTTP 200 |
| Invalid-signature Blog webhook POST | `{"code":0,"msg":"Invalid signing key."}`; no publication attempt accepted |

## Items not verified automatically

- Direct database row-level backup/restore and database permissions could not be inspected with production credentials because no database URL or admin session is available in the local environment. Public content exports are retained in the ignored backup directory.
- Vercel CPU, memory, database query latency, queue telemetry and third-party account quotas are not exposed through this repository or connected Vercel APIs.
- Browser matrix and device performance lab tests were not run; use Vercel Speed Insights and real-device testing for those measurements.
- Product records lacking verified specs are intentionally excluded from the sitemap. They need the fields documented in `data-required.md` before indexing.

## Residual risks

1. Turbopack reports a broad file-tracing warning from existing CMS filesystem fallback code. Build succeeds, but narrowing the development-only filesystem fallback is recommended.
2. The static tag files remain in the repository for rollback history, but the production proxy prevents public indexing. They can be removed in a separately backed-up cleanup release.
3. Google Search Console recrawl and validation timing is controlled by Google and cannot be guaranteed by an application deployment.
