# News And Blog Boundary Audit

| Boundary | Evidence | Result |
| --- | --- | --- |
| Public URLs | `/news/*` and `/blog/*` use separate route handlers | Pass |
| CMS type | News publisher saves `type: "news"`; Blog webhook saves `type: "blog"` | Pass |
| Automation | `lib/newsAutomationV2.js` has no Blog write call | Pass |
| Sitemap data | `lib/sitemapService.js` reads separate News and Blog collections | Pass |
| Blog auto-publishing | No News cron calls Blog routes, APIs or collections | Pass |

The existing CMS uses a shared persistence table with a required content type discriminator rather than separate physical tables. Queries and public routes remain type-scoped.
