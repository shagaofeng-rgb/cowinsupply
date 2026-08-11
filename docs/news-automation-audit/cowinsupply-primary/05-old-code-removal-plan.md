# Old Code Removal Plan

Implemented conflict removals:

- Replaced the old single News execution path, which fetched and could publish in one invocation, with separate ingest and publication phases.
- Replaced the old daily News cron with a 12-hour ingest cron and a separate 12-hour publication retry trigger guarded by a 48-hour successful-publication interval.
- Stopped ingest from preparing article body content or writing published content.
- Reduced News product context to one internal product link and removed the sales-oriented support FAQ.

Preserved:

- Existing News pages, admin controls and historic published content.
- Existing Blog pages, Blog webhook and manual/third-party Blog publishing path.
- Existing sitemap and Google submission tasks.
