# News Automation Audit Before Rebuild

Date: 2026-08-08 (Asia/Shanghai)

## Starting state

- The prior News automation implementation and its Vercel Cron route were removed in commit `5cff7e4`.
- Existing published News content, News routes, sitemap generation, product records and Blog content remain in the CMS store.
- Blog webhook remains verification-only and does not create or publish Blog articles.
- PostgreSQL/Neon is the production persistence layer. The new automation uses independent `news-automation-v2-*` storage keys and a persistent lock.

## Safety baseline

- No existing News or Blog content is deleted by this rebuild.
- Legacy job/audit/source configuration keys are cleared only on first production initialization; published CMS articles are not touched.
- No source passwords, API keys or database credentials are written into source code or this report.
