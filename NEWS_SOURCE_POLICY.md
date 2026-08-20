# Cowin Supply News source policy

The complete user-supplied raw catalog is retained in `data/news/source-catalog.input.md`. Generated catalog artifacts are stored beside it as JSON, CSV and Markdown.

- A source is inactive until public access, robots policy and a usable RSS/API/public endpoint are recorded.
- Forums, Reddit, Quora and discussion boards are discovery-only. They cannot be the sole factual source for a published News article.
- Source text is used only for attributed factual verification and linked context. External editorial images are not copied or hotlinked.
- `www.constructionenquirer.com` is currently the only active source: its public RSS returned `200 application/rss+xml` on 2026-08-20 and its robots file allows the public feed. It remains subject to every article-level freshness, relevance, duplicate and rights gate.
- `www.protoolreviews.com`, `www.equipmentworld.com` and the legacy Construction Dive feed returned anti-bot/Cloudflare responses in this audit. They are not enabled or bypassed.
- The source catalog is not a license to use every listed topic. Mining, recycling, bulk-material and magnetics reporting is eligible only where it has a direct, non-exaggerated connection to an audited Cowin Supply product and jobsite scenario.
