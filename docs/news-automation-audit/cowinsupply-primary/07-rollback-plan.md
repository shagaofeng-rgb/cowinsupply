# Rollback Plan

1. Restore `vercel.json`, `lib/newsAutomationV2.js`, `app/api/cron/news/route.js`, and `app/api/admin/news/automation/route.js` from the pre-change Git commit or `.audit-backups/full-site-audit-20260811-103952/`.
2. Remove the `/api/cron/news-ingest` schedule only after restoring the former schedule, so no period is left without a News task.
3. Do not delete the site-prefixed v3 candidate/run/state keys; retain them for diagnosis. They are independent of historic v2 records.
4. Re-deploy the last known production deployment if a release rollback is needed.

No database migration or content deletion is required to roll back this code change.
