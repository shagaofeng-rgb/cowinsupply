# Schedules And Trigger Chain

| Task | Production route | Schedule (UTC) | Writes | Can publish |
| --- | --- | --- | --- | --- |
| Daily News orchestrator | `/api/cron/news-daily` | `50 * * * *` | Reassess candidates, publish the best verified external update, use a seven-day fallback when needed, then publish an original Cowin Supply buyer briefing only if external candidates remain blocked | Yes, exactly one successful article per Asia/Shanghai calendar day |
| Sitemap refresh | `/api/cron/sitemap` | `10 18 * * *` | Sitemap only | No |
| Google sitemap submission | `/api/cron/google-sitemap-submit` | `0 4 */2 * *` | Submission log through sitemap service | No |
| GSC inspection audit | `/api/cron/indexing-audit` | `20 4 * * *` | Rotating, sanitized URL Inspection results | No |

The hourly orchestrator checks whether the current Asia/Shanghai calendar day already has a frontend-verified publication. If so it exits successfully without creating another article. Otherwise it runs ingest and publication. External reporting keeps source, deduplication, owned-media and frontend checks. If all external candidates remain blocked, the publisher creates an original catalog-backed buyer briefing rather than silently returning success with no article. A due run that still cannot publish returns a non-2xx status and logs rejection-reason counts. Independent persistent locks are `news:ingest:cowinsupply-primary` and `news:publish:cowinsupply-primary`.
