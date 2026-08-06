# Cowin Supply SEO Baseline

Date: 2026-08-06 (Asia/Shanghai)

## Architecture

- Application: Next.js App Router on Vercel.
- Persistent content storage: Neon/Postgres-backed `cowin_store` records.
- Public content API reads the same CMS records used by the public routes.
- Production hostname: `https://www.cowinsupply.com`.

## Content action baseline

- Public export before cleanup: 107 News, 1 Blog, 18 products.
- Removed by the one-time production cleanup: 96 template-derived News records, 11 legacy thin News records, and one webhook verification Blog record.
- Replacement editorial guides: 3 Blog guides with redirects from the named legacy News URLs.
- Backup export location (ignored from Git): `backups/seo-before-cleanup/`.

## Current indexing policy

- Only published editorial entries with usable title and content are sitemap eligible.
- News requires editorial publication and is never automatically made public.
- Products require a published record, a summary and specification rows to be sitemap eligible.
- Tag archives are excluded and return either an intentional 301 category redirect or 410.
