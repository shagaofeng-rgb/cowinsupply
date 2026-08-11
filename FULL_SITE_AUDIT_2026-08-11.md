# CowinSupply Full-Site Audit - 2026-08-11

## Scope and safeguards

- Audit window: 2026-08-11 (Asia/Shanghai).
- Production target: `https://www.cowinsupply.com`.
- Rollback snapshot: `.audit-backups/full-site-audit-20260811-103952/`.
- The snapshot contains the deployment configuration, package configuration, News automation, Blog webhook, Google sitemap-submit route, and separate copies of both route files in `routes/`.
- No production content, customer records, products, Blog articles, or database records were deleted during this audit.
- No secret value is recorded in this report.

## Architecture observed

| Area | Evidence | Result |
| --- | --- | --- |
| Application | Next.js App Router application, Next 16 runtime | Confirmed |
| Production persistence | `GET /api/health` returned `200` with `persistence.configured: true` and `provider: PostgreSQL (Neon)` | Confirmed |
| Content persistence | `lib/persistentStore.js` stores server data in Neon tables `cowin_store` and `cowin_job_locks`; `lib/cmsStore.js` is the CMS access layer | Confirmed from code and health check |
| Content API | `app/api/content/[type]/route.js` exposes server-backed product, Blog, News, and sitemap content | Confirmed by production API responses |
| Admin writes | `app/api/admin/content/[type]/route.js` uses authenticated admin operations and `saveCmsItem` | Confirmed from code; no admin session available for a live write test |
| Blog publishing intake | `POST /api/webhook/send_article`, plus root `POST /` forwarding in `app/route.js` | Confirmed live; see Blog section |

## Active scheduled work

Source: `vercel.json`, production deployment configuration committed in the repository.

| Task | Route | Schedule (UTC) | Purpose | Status |
| --- | --- | --- | --- | --- |
| Email health | `/api/cron/email-health` | `30 2 1,15 * *` | Semi-monthly mail delivery health check | Configured |
| Sitemap refresh | `/api/cron/sitemap` | `10 18 * * *` | Refresh website maps without a Google submission | Configured |
| News scheduler wake | `/api/cron/news` | `0 2 * * *` | Checks state daily; `lib/newsAutomationV2.js` only performs the full fetch/generate/publish cycle after 48 hours | Configured |
| Google sitemap submission | `/api/cron/google-sitemap-submit` | `0 4 */3 * *` | Authenticated sitemap refresh and Google Search Console submission | Configured every three days |

No GitHub Actions directory was found. No separate worker, message queue, or queue consumer was found in the repository. `tools/sync-cowinsupply.ps1` is an on-demand import utility, not a deployed schedule.

## Production checks performed

All checks below were performed against production on 2026-08-11. Response times are single network samples, not Core Web Vitals laboratory measurements.

| Endpoint | HTTP | Sample time | Result |
| --- | ---: | ---: | --- |
| `/api/health` | 200 | 2104 ms | Neon persistence reported configured |
| `/api/content/products?pageSize=3` | 200 | 3740 ms | Server-backed product data returned |
| `/api/content/blog?pageSize=3` | 200 | 1419 ms | Server-backed Blog data returned |
| `/api/content/news?pageSize=3` | 200 | 1114 ms | Server-backed News data returned |
| `/api/content/sitemap` | 200 | 1875 ms | Sitemap content returned |
| `/sitemap.xml` | 200 | 555 ms | Public sitemap available |
| `/robots.txt` | 200 | 403 ms | Public robots policy available |
| `/` | 200 | 372 ms | Homepage available |
| `/product` | 200 | 1515 ms | Product listing available |
| `/blog` | 200 | 1256 ms | Blog listing available |
| `/news` | 200 | 3525 ms | News listing available |
| `/about` | 200 | 532 ms | About page available |
| `/contact` | 200 | 364 ms | Contact page available |

### Random production content consistency sample

The public CMS API and the final public detail page were checked together. This proves the currently rendered public data path; a database-console and authenticated-admin comparison was not possible with the credentials available to this audit.

| Type | Slug | API/public status | Detail page result |
| --- | --- | --- | --- |
| Product | `KFT-Q450BrushlessJigSaw` | published | 200; product title and canonical present |
| Product | `6000wsolttingmachine` | published | 200; product title and canonical present |
| Product | `HeavyCuttingMachine` | published | 200; product title and canonical present |
| Blog | `brushless-angle-grinder-buyer-guide` | published | 200; title and canonical present |
| Blog | `angle-grinder-troubleshooting-and-safety` | published | 200; title and canonical present |
| Blog | `brushless-wall-chaser-selection-guide` | published | 200; title and canonical present |

## Automated site and SEO verification

| Check | Command | Result |
| --- | --- | --- |
| Public route self-check | `node tools/site-self-check.mjs https://www.cowinsupply.com` | 18 checked, 0 failed |
| Indexability audit | `node tools/indexability-audit.mjs https://www.cowinsupply.com` | 36 URLs passed, 0 failed |
| Structured data audit | `node tools/structured-data-audit.mjs https://www.cowinsupply.com` | 1 current News article checked, 0 failed |
| Vercel runtime errors | Vercel runtime-error query, 24-hour window | No runtime errors found |

The self-check covered the public home, product, News, contact, News APIs, sitemap APIs, robots, sitemap index and children, health endpoint, and a current News detail page.

## Blog module and third-party webhook

### Existing implementation

- Blog already exists at `app/blog/page.js` and `app/blog/[slug]/page.js`.
- The receiving endpoint is `app/api/webhook/send_article/route.js`.
- The endpoint accepts the documented form fields: `sign`, `class_id`, `title`, `content`, `author_id`, and `image_url`.
- The root `POST /` compatibility forwarder exists in `app/route.js` for the custom-framework plugin verifier.
- Valid verification-only requests return success without writing an article.
- Valid complete requests normalize and sanitize content, create a published Blog item, preserve a SHA-256 content fingerprint, and return success.
- `webhookContentHash` blocks a retry from creating the same Blog article twice.

### Live compatibility test and blocker

A production verification request was sent to both the root compatibility endpoint and the direct webhook endpoint using the API key previously supplied for the third-party plugin. Both routes returned HTTP 200 with the application response `code: 0` and `Invalid signing key.`

This confirms that routing is live and the receiver is responding, but the production environment value of `WEBHOOK_ARTICLE_SIGN` does not match the key currently entered in the plugin. No key value is included here.

**Required production action before a real article publication test:** set Vercel Production environment variable `WEBHOOK_ARTICLE_SIGN` to exactly the API key stored in the authorized plugin, then redeploy production. The same exact value must be retained only in Vercel and the authorized plugin, never committed to Git. After that change, a one-article end-to-end test can verify plugin -> webhook -> Neon -> admin -> `/blog` -> sitemap.

The audit did not create a live test Blog article because the required production signing configuration does not currently authenticate it.

## Google SEO active submission task

- Actual production schedule is defined in `vercel.json`, not only documentation: `0 4 */3 * *` for `/api/cron/google-sitemap-submit`.
- The route in `app/api/cron/google-sitemap-submit/route.js` requires cron authorization, calls `refreshSitemap` with `submit: true`, and returns a failure response when the sitemap refresh or Search Console submission fails.
- Daily `/api/cron/sitemap` refresh remains separate and uses no Google submission, preserving sitemap freshness without daily Google pushes.
- There is no GitHub Actions-based duplicate Google submission task in the repository.

The route could not be manually invoked from this workstation because the local cron secret does not authorize production. Vercel Cron authentication is intentionally server-side; attempting to bypass it would be unsafe. Production Cron execution logs or a Vercel Cron dashboard session are required to verify the next actual submission timestamp and Search Console response.

## Confirmed normal

- Production health endpoint reports configured Neon PostgreSQL persistence.
- Public products, Blog, News, sitemap and robots endpoints are available and return 200.
- Six sampled real product/Blog records are published in the CMS API and visible at their public canonical pages.
- Route, indexability and structured-data audit scripts passed as recorded above.
- No runtime errors were returned by the Vercel 24-hour runtime-error query.
- Blog receiver and root compatibility endpoint are deployed and respond in the required JSON format.
- Google sitemap-submit schedule is configured at one execution per three calendar days.

## Found and repaired in the deployed codebase

These production repairs were completed in the preceding deployment sequence and were re-checked during this audit:

| Commit | Repair |
| --- | --- |
| `86dff48` | Restored authenticated Blog webhook publishing, verification behavior, HTML safety filtering, published state mapping and duplicate-content protection |
| `fc67db8` | Removed the blanket manual-review block from eligible News publishing while retaining source, safety and duplicate quality gates |
| `87dafd3` | Changed News to a 48-hour full fetch/generate/publish cycle and required detail/list visibility checks before recording a successful publish |

Latest verified production deployment: `dpl_BbGSJEAjzhG1naAcBhkGHD4awbyN`, status `READY`, with aliases including `www.cowinsupply.com`.

## Not verified or not repaired because access is intentionally unavailable

| Item | Why it cannot be marked complete | Safe next action |
| --- | --- | --- |
| Direct database schema, privileges, row integrity, duplicate rows and slow-query plan | No production Neon console/connection credential was available to this audit | Use a least-privilege read-only Neon connection or console session for `cowin_store` and `cowin_job_locks` inspection |
| Three real inquiry records across DB/admin/API/frontend | No authenticated admin session and no safe read-only database access | Authenticate an admin reviewer, then compare three existing inquiry IDs without creating customer-facing test mail |
| Actual Blog plugin publication | Production `WEBHOOK_ARTICLE_SIGN` and plugin key are mismatched | Correct the Vercel Production environment variable and redeploy, then publish a clearly labelled test item and move it to draft after verification |
| Blog tags, filters, search, page controls, scheduled publishing and visual preview | Existing Blog routes work but those advanced management/listing capabilities are not present in the currently inspected implementation | Treat as a separate feature delivery after data and admin UX requirements are approved |
| Actual next Google submission and Search Console response | Manual request cannot supply the Vercel cron authorization; no Vercel Cron dashboard access in this audit | Check the Vercel Cron run after its next scheduled time and retain its response log |
| CPU, memory, disk, database connection pool and server process metrics | Vercel serverless/Neon infrastructure metrics are not exposed through public endpoints | Review Vercel and Neon observability dashboards |
| Desktop/mobile interaction screenshot regression | Public HTTP and HTML self-checks ran; browser control was not available in this audit session | Run the existing browser visual regression flow under an authenticated browser-capable session |

## Build and rollback

Previously completed for the deployed code changes: ESLint, Node test suite, and production Next build all passed. The current audit changed only this report and backup artifacts, not runtime code.

Rollback options:

1. Re-deploy the last known production Vercel deployment `dpl_BbGSJEAjzhG1naAcBhkGHD4awbyN` if a documentation-only deployment is not desired.
2. Restore targeted files from `.audit-backups/full-site-audit-20260811-103952/` and redeploy after review.
3. For content or persistence incidents, do not delete rows; use the existing CMS status/rollback workflow or restore from a Neon backup after identifying the affected store key.

