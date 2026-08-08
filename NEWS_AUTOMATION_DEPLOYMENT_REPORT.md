# News Automation V2 Deployment Report

Date: 2026-08-08 (Asia/Shanghai)

## Implemented system

- News automatic publishing is enabled through `lib/newsAutomationV2.js`; Blog automatic publishing remains disabled.
- The only News scheduler is `GET /api/cron/news`, configured in `vercel.json` as `0 */6 * * *`.
- The six-hour schedule only discovers, verifies and prepares candidates. `lastSuccessfulPublishAt` plus `publishIntervalHours: 48` permits at most one successful V2 publication every 48 hours.
- The persistent lock `cowinsupply-news-automation-v2` prevents concurrent executions. Candidate, run, configuration and state records use the dedicated `news-automation-v2-*` PostgreSQL keys.
- The first V2 persistent initialization clears legacy task state (`news-jobs`, `news-publication-audits`, `news-sources`) without deleting existing CMS News or Blog records.

## Quality gates before publication

1. Source has an HTTPS URL and a verifiable date no older than 90 days.
2. Source is high-trust or first-party, and its data is saved with URL, publisher, author where available, dates, region placeholder, license note and SHA-256 fingerprints.
3. The event has at least one real CowinSupply product match from the live product CMS data.
4. Source URL and title/content similarity checks reject duplicate events or near-duplicate content.
5. A CowinSupply-owned product image is required; no third-party editorial image is downloaded or hotlinked.
6. Original facts and CowinSupply analysis are stored separately. The generated page contains visible source attribution, FAQ, product/category links, canonical metadata and structured data.
7. Sitemap refresh and the configured Google Search Console sitemap submission are attempted only after a successful publish. The result is recorded as a request/submission state, never as a claim that Google indexed the page.

## Admin and operations

- Chinese News admin page: `/admin/news`.
- Admin API: `GET`/`POST /api/admin/news/automation` supports dashboard reads, dry run, execution, configuration toggle, candidate archive and withdrawal of an automatically published V2 item.
- Each published News item retains `automationVersion`, candidate ID, source fields, product relations, content hash, image license note and Google submission result fields.
- Blog webhook remains manual-only. It does not call the News scheduler and it does not create Blog articles.

## Local verification evidence

| Check | Result |
| --- | --- |
| `npm run test:news` | Passed: 2/2 tests |
| `npm run build` | Passed: TypeScript and production route compilation succeeded |
| `GET /api/cron/news?dryRun=1` | HTTP 200; fetched 10 Construction Dive RSS items, 10 within the 90-day window; created 10 in-memory candidates; `published: false` (dry run) |
| `GET /news` | HTTP 200 |
| `GET /blog` | HTTP 200; no automatic Blog publishing flow was invoked |
| `GET /news-sitemap.xml` | HTTP 200, valid News sitemap XML root returned |

## Deployment-time checks still required

- Vercel production must have `DATABASE_URL`/`POSTGRES_URL` and a non-empty `CRON_SECRET`. The cron endpoint fails closed in Vercel if `CRON_SECRET` is absent.
- Google submission needs the existing Search Console service account to retain sitemap ownership permissions. A successful sitemap request is not evidence of index inclusion.
- Initial production runs can create candidates, but may only publish one article after all gates pass; rejected items stay in `needs_review` with recorded reasons.

## Residual build note

Next.js reports its existing broad file-tracing warning from `lib/cmsStore.js` and the legacy file-backed local-development fallback. The build itself succeeds; production persistence continues to use PostgreSQL when configured.
