# News policy supersession report

The following policy controls are superseded by News automation v4:

- 12-hour News publication trigger in `vercel.json`.
- 48-hour successful-publication gate in `lib/newsAutomationV2.js` and the News admin wording.
- The legacy non-catalog default source.

Replacement policy:

- One protected daily orchestrator at `00:10 UTC`.
- At most one successful News publication per Asia/Shanghai calendar day.
- No publication when source, product relevance, originality, image ownership, humanizer, length, SEO or frontend-delivery gates fail.
- Blog automation remains disabled and its webhook route is not imported by the News system.

Historical published News, Blog posts and source-attribution fields are retained. The persistent migration record is `cowinsupply-primary:news-automation-v3-migration` with version `v4`.
