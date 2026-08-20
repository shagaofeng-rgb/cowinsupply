# News automation audit before daily-policy migration

- Site: `cowinsupply-primary` at `https://www.cowinsupply.com`.
- News and Blog already use separate public routes, CMS types and sitemap paths.
- The pre-migration production configuration used two 12-hour Vercel triggers and a 48-hour successful-publication gate.
- The pre-migration source list contained a legacy source outside the supplied catalog. It is superseded, not used by the new daily policy.
- Published News and Blog records are retained. No historical articles, products or URLs were deleted by this migration.
- Product audit baseline: `data/audits/product-audit.{json,csv,md}`. Known manual-review items are KFT-K190 duplicate records, KFT-Y370 category/safety status and KRT/KFT A125 prefix conflict.
