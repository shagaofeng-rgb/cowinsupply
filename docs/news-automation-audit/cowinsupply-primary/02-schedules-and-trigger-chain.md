# Schedules And Trigger Chain

| Task | Production route | Schedule (UTC) | Writes | Can publish |
| --- | --- | --- | --- | --- |
| Daily News orchestrator | `/api/cron/news-daily` | `10 0 * * *` | First site-scoped candidate and run records, then a quality-gated News article, delivery check and sitemap update | Yes, at most one successful article per Asia/Shanghai calendar day |
| Sitemap refresh | `/api/cron/sitemap` | `10 18 * * *` | Sitemap only | No |
| Google sitemap submission | `/api/cron/google-sitemap-submit` | `0 4 */3 * *` | Submission log through sitemap service | No |

The daily orchestrator calls the existing isolated ingest phase before the isolated publish phase. Ingest never generates, saves or publishes an article. Publish requires a verified catalog source, owned product media, similarity checks, humanizer checks, required word count and frontend visibility. Independent persistent locks are `news:ingest:cowinsupply-primary` and `news:publish:cowinsupply-primary`.
