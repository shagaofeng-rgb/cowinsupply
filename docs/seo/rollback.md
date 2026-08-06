# Rollback Procedure

1. In Vercel, promote the previous ready production deployment if the current release causes a production incident.
2. Restore the public content export retained under `backups/seo-before-cleanup/` through an authenticated maintenance workflow only. Do not restore content records blindly; this backup includes entries deliberately removed for quality reasons.
3. The one-time cleanup marker is the persistent key `seo-cleanup-version`; clearing it may re-run the cleanup policy, so do not clear it during a rollback without reviewing the intended dataset.
4. Re-run `npm run test:news`, `npm run build`, and production HTTP checks after recovery.
