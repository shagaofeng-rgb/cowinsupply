# CowinSupply Operational Status - 2026-08-08

## Verified online

The following production endpoints returned HTTP 200 in the final smoke check:

- `/`, `/product`, `/products/wall-chasers`, and `/product/KFT-Q450BrushlessJigSaw.html`
- `/news`, `/blog`, `/about`, and `/contact`
- `/robots.txt`, `/sitemap.xml`, and `/sitemaps/sitemap-products.xml`

The Vercel runtime-error aggregation reported no runtime errors for the last seven days. The latest deployed application version at this check was `dpl_5LJMRTUnoKfYpYY8H6SsZC4AfeXy`.

## Completed operating controls

- News V2 is server-scheduled, quality-gated, source-attributed, deduplicated, and limited to one successful publication per 48 hours.
- Blog automatic publishing remains disabled and manual Blog content is preserved.
- Sitemap refresh runs daily; Google sitemap submission runs every three days; News candidate collection runs every six hours.
- The News admin panel now supports source whitelist/blacklist maintenance, timezone, operating hour, dry-run, execution, pause/resume, candidate archive and automatic-News withdrawal.
- Public News rendering removes source HTML fragments, uses CowinSupply product media only, and provides responsive text, image, URL and table behavior.

## Items intentionally not auto-modified

1. All 18 historical product records still need real, model-specific supplier datasheets before technical specifications, certification claims, MOQ, lead time, warranty or performance figures can be marked verified and indexed.
2. The historical company address is excluded from dynamic public output until its accuracy is confirmed.
3. Two KFT-K190 historical records remain separate until a business owner confirms whether they are the same sellable configuration.
4. The existing local filesystem fallback produces a non-blocking Turbopack tracing warning. Production uses PostgreSQL persistence; the warning does not prevent build or deployment.

## Safety rule

These items are not automatically filled with assumptions or copied competitor data. Their required inputs and rollback evidence are recorded in `PRODUCT_DETAIL_REBUILD_REPORT.md` and `CONTACT_INFO_CONFLICTS.md`.
