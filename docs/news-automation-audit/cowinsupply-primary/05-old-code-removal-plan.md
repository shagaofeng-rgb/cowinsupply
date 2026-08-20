# Old Code Removal Plan

Implemented conflict removals and supersessions:

- Replaced the old single News execution path, which fetched and could publish in one invocation, with separate ingest and publication phases.
- Replaced the former 12-hour ingest and 12-hour publication schedules with one protected daily orchestrator at `00:10 UTC` (`08:10` Asia/Shanghai).
- Replaced the former 48-hour successful-publication interval with a single successful-publication limit per Asia/Shanghai calendar day.
- Replaced the legacy standalone source with the user-supplied source catalog. Only sources that have a recorded public-feed and robots verification can be enabled.
- Stopped ingest from preparing article body content or writing published content.
- Preserved the one-product contextual-link limit and non-promotional source attribution.

Preserved:

- Existing News pages, admin controls and historic published content.
- Existing Blog pages, Blog webhook and manual/third-party Blog publishing path.
- Existing sitemap and Google submission tasks.
