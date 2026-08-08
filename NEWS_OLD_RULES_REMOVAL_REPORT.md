# Old News Rule Removal Report

## Replaced rules

The old implementation had been physically removed before this rebuild, including its high-frequency collection code, `/api/cron/news`, legacy admin jobs/audits endpoints and its `autoPublish: false` manual-review-only configuration.

This rebuild replaces that design with one V2 workflow:

- `lib/newsAutomationV2.js` is the sole News scheduler implementation.
- `/api/cron/news` is the sole enabled News Cron endpoint and runs every six hours only to collect/check candidates. It is not a publication frequency.
- A durable `lastSuccessfulPublishAt` gate limits publishing to one article at least 48 hours after the previous successful V2 publication.
- On its first persistent run, V2 clears legacy `news-jobs`, `news-publication-audits`, and `news-sources` task state while preserving CMS content.
- Blog automation remains disabled: `/api/webhook/send_article` validates the connection but does not publish Blog content.

## Removed concepts

`NEWS_DAILY_TARGET`, four-per-day behavior, old scheduler state, and “collect drafts only” behavior are not used by V2.
