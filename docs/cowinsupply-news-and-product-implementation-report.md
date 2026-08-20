# Cowin Supply News and product implementation report

## Scope and baseline

- Site: `cowinsupply-primary` (`https://www.cowinsupply.com`)
- Deployment commit: `ca00e1e`
- Production deployment: `dpl_He1QqjMSGj9vCMd1d9h6ohFwk3RF`, READY
- Historical News, Blog posts, products and URLs were retained. No automated deletion, redirect or noindex action was performed.

## Product audit

- 18 legacy catalog records were audited in `data/audits/product-audit.{json,csv,md}`.
- 8 records have a linked verified technical data record, 1 is partial and 9 remain placeholders pending source material.
- KFT-K190 duplicate records were retained for review; no URL was removed.
- KFT-Y370 remains `needs_confirmation` for category, blade range and safety configuration. It is not used as a magnetic drill, standard annular cutter or automated-News product context.
- KRT-A125/KRT-A125B versus KFT-A125/KFT-A125B remains a documented model-prefix conflict; no silent rename was made.
- `data/products/taxonomy-map.json` records the canonical taxonomy and legacy mappings. `data/products/topic-profiles.json` only permits the 8 audited/verified products to be used by the News automation.

## Source catalog and content safety

- The supplied source appendix was preserved verbatim in `data/news/source-catalog.input.md`.
- The builder generated 299 unique normalized sources across 6 groups. 23 forum, Reddit, Quora or board sources are discovery-only.
- `www.constructionenquirer.com` is the only enabled source. On 2026-08-20 its RSS endpoint returned `200 application/rss+xml`; its robots policy permits the public feed.
- Pro Tool Reviews, Equipment World and the former Construction Dive endpoint returned anti-bot/Cloudflare responses during read-only checks. They remain disabled. No access restriction was bypassed.
- All News imagery remains Cowin Supply owned product media. External news images are neither copied nor hotlinked.

## News automation migration

- The former Vercel 12-hour ingest and 12-hour publish schedules were replaced by one authenticated daily orchestrator: `/api/cron/news-daily` at `10 0 * * *` UTC, which is 08:10 Asia/Shanghai.
- The orchestrator runs the existing ingest phase first, then the isolated publication phase. Ingest does not generate, save or publish an article.
- Publication is capped at one successful item per Asia/Shanghai calendar day. Blog automation remains disabled and the Blog webhook is not imported by the News workflow.
- Publication now requires: a verified catalog source, a News-approved product profile, source recency and duplicate checks, owned product image, 1,100-1,600 word content, a deterministic humanizer audit, SEO fields and post-save frontend verification of both list and detail routes.
- Failed gates return `rejected` or `needs_review`; they do not publish a draft or force a replacement article.
- The persistent migration record documents that the old 12-hour/48-hour rules and the non-catalog source configuration were superseded. Published records are preserved.

## Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Source catalog build | Passed | `node tools/build-news-source-catalog.mjs`: 299 unique, 23 discovery-only |
| Unit tests | Passed | 6 tests: query, site configuration and humanizer |
| Lint | Passed | ESLint over `app`, `components`, `lib`, `proxy.js` |
| Production build | Passed | Next.js build includes `/api/cron/news-daily` |
| Production deployment | Passed | Vercel `dpl_He1QqjMSGj9vCMd1d9h6ohFwk3RF` READY |
| Public News route | Passed | `https://www.cowinsupply.com/news` returned 200 |
| News sitemap | Passed | `https://www.cowinsupply.com/news-sitemap.xml` returned 200 |
| Main sitemap | Passed | `https://www.cowinsupply.com/sitemap.xml` returned 200 |
| Cron authentication | Passed | Unauthenticated `/api/cron/news-daily` returned 401 |

## Items awaiting the next legitimate scheduled run

- The daily production Cron was not invoked manually because its `CRON_SECRET` is intentionally not exposed or bypassed. Its first normal run will create a persistent run record and, only if all gates pass, a new frontend-visible News item.
- A live automatic publication cannot be claimed yet. A compliant source item must be recent, product-relevant and sufficiently factual to pass the content, originality and frontend-delivery gates.
- Additional catalog sources should be enabled only after the same public-feed and robots verification has been recorded. This increases resilience without relaxing source policy.

## Rollback

- Code rollback: redeploy the prior Vercel production deployment `dpl_8mCe4XC4Z6ADDAPJ3ikw4ML5Up2b` or revert commit `ca00e1e`.
- Data rollback: migration does not delete content. The prior persistent News configuration is preserved in the platform's backup/history; restoring it should be followed by a deploy and a scheduled-task review.
