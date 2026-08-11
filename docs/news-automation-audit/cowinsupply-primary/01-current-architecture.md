# Current Architecture

- `site_id`: `cowinsupply-primary`
- Public News routes: `/news`, `/news/[slug]`, `/news-sitemap.xml`, `/api/news/*`.
- Public Blog routes: `/blog`, `/blog/[slug]`, `/api/content/blog/*`.
- CMS data is isolated by the `type` argument in `lib/cmsStore.js`; News automation writes only `type: "news"`.
- Persistent candidates, run records, state and locks now use site-prefixed `news-automation-v3` keys.
- The Blog webhook remains `POST /api/webhook/send_article`; it does not import or call the News automation module.

Historical published News and Blog records are retained. This migration does not delete, redirect, noindex or alter existing content.
