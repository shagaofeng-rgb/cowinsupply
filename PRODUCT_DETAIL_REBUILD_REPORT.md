# CowinSupply Product Detail Rebuild Report

Completed: 2026-08-08 (Asia/Shanghai)

## Scope and backup

- Backup created before edits: `backups/product-rebuild-2026-08-08/`.
- Backed up files: `data/legacyProducts.json`, `lib/cmsStore.js`, `lib/productRendering.js`.
- No existing product record, legacy product slug, media path, news item or blog item was deleted by this rebuild.
- Local runtime verification inquiry was removed after test. The test triggered one SMTP notification before cleanup; no test product or public content was created.

## Completed data foundation

- Audited **18** product records. The full before-state inventory is in `PRODUCT_AUDIT_BEFORE_REBUILD.md`.
- Added one canonical taxonomy in `lib/catalogTaxonomy.js`, covering Wall Chasers & Concrete Cutting, Cutting Tools, Drilling Tools, Surface Finishing Tools, Measuring Tools and Precision Tools with the requested subcategories.
- Normalized display titles, corrected `diastimeter` and wall-chaser misclassification, retained all historical product slugs, and flagged the two `KFT-K190` records as duplicate-model records requiring supplier confirmation.
- Added `data/companyProfile.json` as the single contact source used by dynamic header/footer, product pages, WhatsApp link and static-page generator.
- Phone, email and WhatsApp use the confirmed values. The historical address is deliberately marked `pending-confirmation` and excluded from the new dynamic footer/schema output.
- Created `CONTACT_INFO_CONFLICTS.md` and `URL_REDIRECT_MAP.csv`.

## Product detail pages

- Rebuilt the common product detail renderer with breadcrumb, image gallery, hero facts, application tags, inquiry list control, overview, advantages, parameter state, applications, industry selection process, gallery, FAQ, related products and structured inquiry form.
- Product images use `object-fit: contain`; images are never treated as a stretched background.
- Parameters only render when a row is explicitly marked `verified: true`. Historic listing copy is not silently promoted into a specification table.
- Each detail page includes canonical, Open Graph tags, `Organization`, `BreadcrumbList`, `Product` and `FAQPage` JSON-LD, ALT text and internal links.
- The 18 product URLs are included in `sitemap-products.xml`.

## Backend and enquiry data

- Product records now support model, category slug, gallery, features, applications, verified parameter rows, FAQ, related products/articles, SEO fields, parameter confirmation status and soft-delete state.
- Product saves and status changes create a snapshot record for version history. A restore API action is available for a saved product version.
- Product enquiry forms now include product, model, source URL, country/region, buyer type, estimated quantity, required voltage/specification and UTM fields. The API persists those fields and includes them in the notification email.
- Admin product management has been repaired from garbled text and now exposes product data fields, draft/publish state and parameter verification status.

## URL and indexability policy

- Existing product URLs are unchanged and return the rebuilt page.
- Replaced legacy category URLs return one-hop 301 redirects to canonical category pages. No redirect points to the homepage.
- Product pages without verified specifications remain `noindex,follow` to avoid presenting unverified historical claims as indexable product data. They remain accessible, enquiry-enabled and present in the product sitemap.
- Once a current specification sheet is confirmed, set verified parameter rows and `seoIndexable: true` in the backend; the page will become indexable without changing its URL.

## Verification evidence

| Check | Result | Evidence |
|---|---|---|
| News unit tests | Pass | `npm run test:news`: 2/2 tests passed |
| Production build | Pass | `npm run build`: compiled and TypeScript completed |
| Full local self-check | Pass | `SELF_CHECK_BASE_URL=http://127.0.0.1:3003 npm run self-check`: 15 checked, 0 failed |
| Legacy product URL | Pass | `/product/KFT-Q450BrushlessJigSaw.html` returned 200 with canonical and Product JSON-LD |
| Canonical category | Pass | `/products/wall-chasers` returned 200 with canonical |
| Legacy category redirect | Pass | `/products/brushless-angle-grinders` returned 301 |
| Product sitemap | Pass | `/sitemaps/sitemap-products.xml` contains 18 product locations |
| Inquiry persistence | Pass | Local JSON request to `/api/inquiry` returned 201 and stored all added product-enquiry fields; the local test record was removed afterward |

## Open items requiring real source material

1. Provide current model-specific datasheets or approved supplier records for all 18 products. Until then, parameters, certifications, MOQ, lead times, warranty, OEM/ODM terms and performance claims must not be published as verified facts.
2. Confirm whether the historical address in `CONTACT_INFO_CONFLICTS.md` is approved for public display. Change `addressStatus` to `confirmed` only after that confirmation.
3. Resolve the two historical `KFT-K190` records before merging, deleting, or selecting a primary canonical product record.
4. The project has no standalone `typecheck` npm script. Next.js TypeScript validation ran successfully as part of `npm run build`; adding a dedicated script is a maintenance improvement, not a release blocker.
5. Turbopack retains a non-blocking file-trace warning caused by the existing CMS filesystem fallback. It does not block build or runtime checks, but should be narrowed in a later infrastructure pass.

## Rollback

- Restore source files from `backups/product-rebuild-2026-08-08/` if code rollback is required.
- Use Git to revert this deployment commit for application rollback.
- Product version snapshots are retained in the CMS store for records changed through the admin product workflow.
