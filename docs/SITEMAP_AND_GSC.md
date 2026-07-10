# Sitemap and Google Search Console

Production site: `https://www.cowinsupply.com`

## Public endpoints

- `/sitemap.xml` returns the sitemap index.
- `/sitemaps/sitemap-pages.xml` returns main public pages.
- `/sitemaps/sitemap-products.xml` returns published product URLs.
- `/sitemaps/sitemap-posts.xml` returns published news/blog URLs.
- `/sitemaps/sitemap-categories.xml` returns public tag/category URLs when present.
- `/robots.txt` points Google to `https://www.cowinsupply.com/sitemap.xml`.

The generator uses fully qualified production URLs, XML escaping, UTF-8 output, real page/content `lastmod` dates, and excludes admin, login, search, draft, offline, deleted, and noindex-style URLs.

## Automatic updates

- Admin product/news changes call `refreshSitemap()` after save, publish, offline, or delete.
- Vercel Cron calls `/api/cron/sitemap` daily.
- The cron route submits the sitemap to Google Search Console only when `GOOGLE_SEARCH_CONSOLE_ENABLED=true`.

## Manual command

```bash
npm run sitemap:generate -- --dry-run --verbose
npm run sitemap:generate -- --force
npm run sitemap:generate -- --submit
```

`--dry-run` prints the run result without writing cache/log files. `--submit` uses the Google Search Console Sitemaps API and only reports success when the API request succeeds.

## Environment variables

- `NEXT_PUBLIC_SITE_URL=https://www.cowinsupply.com`
- `GOOGLE_SEARCH_CONSOLE_ENABLED=true`
- `GOOGLE_SEARCH_CONSOLE_SITE_URL=sc-domain:cowinsupply.com`
- `GOOGLE_SEARCH_CONSOLE_SITEMAP_URL=https://www.cowinsupply.com/sitemap.xml`
- `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64` or `GOOGLE_SERVICE_ACCOUNT_JSON`
- `CRON_SECRET`

The service account must be added to the matching Search Console property with sufficient permission to use the Sitemaps API.
