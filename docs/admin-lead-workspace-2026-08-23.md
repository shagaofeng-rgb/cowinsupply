# Admin Lead Workspace Update

## Scope

- Repaired visitor-event ingestion for inquiry journey tracking.
- Replaced the hidden per-row inquiry detail disclosure with a click-to-open lead detail drawer.
- Added durable, row-based production storage for inquiries, visit events, inquiry activities, and notification delivery records.
- Preserved the existing generic store and creates a database migration snapshot before the new tables are used.

## Backup and rollback

- Local snapshot: `backups/2026-08-23-admin-before-lead-workspace/data/`.
- Production migration snapshot: persistent key `operational-store-migration-v1-backup`.
- Migration marker: persistent key `operational-store-migration-v1`.
- Rollback: deploy the prior Git revision. Existing `cowin_store` records remain intact; no legacy content or inquiry records are deleted by this change.

## Data path

1. A public form submits to `/api/inquiry`.
2. The inquiry is stored before notification delivery is attempted.
3. SMTP delivery outcome is stored as a notification record and an inquiry activity.
4. The browser sends a page-view event to `/api/track` with visitor and session IDs.
5. The lead drawer loads the protected per-inquiry API and joins only matching visitor/session events.

## Verification

- ESLint passed for `app`, `components`, `lib`, and `proxy.js`.
- Next.js production build passed.
- `tools/verify-admin-leads.mjs` passed against the local development server.
  - Tracking event returned HTTP 200 and was persisted.
  - The test event was removed immediately after verification.
  - The inquiry detail API rejected unauthenticated access.
  - The authenticated inquiry workspace rendered successfully.

## Remaining scope

- The new lead workspace includes source, path, notification, and activity sections. Assignment, follow-up reminders, spam classification, and CRM outbound sync remain future enhancements.
- Production database tables are created lazily on the first production request when `DATABASE_URL` or `POSTGRES_URL` is configured.
