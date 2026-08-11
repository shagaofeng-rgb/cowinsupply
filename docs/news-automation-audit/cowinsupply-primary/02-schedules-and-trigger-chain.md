# Schedules And Trigger Chain

| Task | Production route | Schedule (UTC) | Writes | Can publish |
| --- | --- | --- | --- | --- |
| News ingest | `/api/cron/news-ingest` | `0 */12 * * *` | Site-scoped candidate and run records only | No |
| News publish | `/api/cron/news` | `20 */12 * * *` | News article, delivery records, sitemap only after a 48-hour gate | Yes, at most one after 48 hours |
| Sitemap refresh | `/api/cron/sitemap` | `10 18 * * *` | Sitemap only | No |
| Google sitemap submission | `/api/cron/google-sitemap-submit` | `0 4 */3 * *` | Submission log through sitemap service | No |

The publish route never fetches sources. The ingest route never calls article generation, CMS article save, sitemap refresh or Google submission. Independent persistent locks are `news:ingest:cowinsupply-primary` and `news:publish:cowinsupply-primary`.
