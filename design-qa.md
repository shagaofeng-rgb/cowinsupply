# Homepage visual QA — selected direction 1

## Comparison target

- Source visual truth: `/Users/apple/.codex/generated_images/01a05276-cfe2-7aa1-9907-e5381b01628b/exec-a6ecb443-61b9-49ca-9599-cc0a318ba68f.png`
- Implementation: `http://localhost:3002/`
- Desktop viewport and state: 1280 × 720 CSS px, default homepage state, device scale factor 1.
- Mobile viewport and state: 390 × 844 CSS px, default homepage state and expanded navigation state.
- Implementation evidence: in-app-browser screenshots captured during this QA run; console error log was empty.

## Full-view and focused comparison

The selected source and implementation were visually inspected at the same desktop viewport. The initial hero, navigation, orange CTA hierarchy, concrete-texture product staging, white catalog bands, factory proof block, application block, news area, inquiry CTA, and dark footer follow the selected source order and visual language.

Focused comparison covered the hero/navigation, product-family row, and mobile hero/menu. The product-family row was updated from three oversized cards to six compact cards, and the featured-product row from three to four cards, matching the source density while routing each item to an existing catalog path. The implementation intentionally uses verified Cowin copy and current product/category destinations in place of unsupported sample claims or invented products from the mock.

## Required fidelity surfaces

- **Fonts and typography:** condensed, high-impact uppercase display treatment is used for major headings; compact bold navigation and helper copy match the source hierarchy.
- **Spacing and layout rhythm:** full-bleed hero, narrow source-like header, six-up category row, four-up product row, dark image-led bands, and CTA/footer cadence are present. No desktop horizontal overflow was detected (`scrollWidth = clientWidth = 1280`).
- **Colors and visual tokens:** dark charcoal/navy surfaces, white content bands, and signal-orange primary actions are consistent throughout.
- **Image quality and asset fidelity:** supplied Cowin product, factory, application, and contact photography are used; no placeholders, custom-drawn imagery, or fabricated brand assets are present.
- **Copy and content:** business-critical navigation, products, real company identity, quote contact, and WhatsApp routes remain available. New display copy avoids unsupported specifications, certifications, sales figures, or market claims.

## Comparison history

1. **P1 — Source density mismatch:** the first implementation used three product-family cards and three featured-product cards. It did not match the selected source's six-up and four-up visual density.
   - Fix: implemented the six-column category layout and added a fourth verified catalog product card.
2. **Post-fix evidence:** desktop screenshot shows the corrected six-up catalog band, four-up featured-products layout, and intact hero hierarchy. Mobile navigation opens and exposes all five public navigation links; no console errors were recorded.

## Primary interactions checked

- Products, News, Blog, About, Contact navigation targets are present.
- Wholesale quote links route to `/contact#quote`.
- WhatsApp links retain the existing official destination.
- Category and product cards point to existing catalog/product routes.
- Mobile menu opens, changes to the “Close navigation” state, and exposes all navigation items.

## Fidelity correction — 2026-09-11

The earlier build preserved the section order but not the reference's precise composition. The correction pass treated the source image as the visual contract and rebuilt the affected surfaces.

**Findings and fixes**

- [P1] Hero composition: the previous headline wrapped into five equal-size lines and the image used a different composition. Fixed with a three-line display hierarchy, reference-aligned left margin, icon-led trust row, and a dedicated 1672 × 941 WebP hero asset.
- [P1] Product-family density: the previous cards were too short and used mismatched product crops. Fixed with six equal cards, 232px image slots, source-matched category copy density, and six dedicated 1448 × 1086 WebP category images.
- [P1] Manufacturing and product sections: the previous image proportions and card heights did not follow the reference. Fixed with a 585px factory frame, partner badge/stat strip, four 268px catalog image slots, and four dedicated product images.
- [P2] Editorial, application, CTA, and footer copy/layout: aligned the titles, item density, dates, actions, and footer hierarchy to the chosen visual source while retaining the existing destination routes and inquiry/WhatsApp behavior.

**Final evidence**

- Source visual truth: `/Users/apple/.codex/generated_images/01a05276-cfe2-7aa1-9907-e5381b01628b/exec-a6ecb443-61b9-49ca-9599-cc0a318ba68f.png` (741 × 2121).
- Implementation: `http://localhost:3002/`, in-app browser, desktop default state at 1280 × 720 CSS px, device scale factor 1. The rendered first viewport was captured after the correction pass; its hero image, three-line type hierarchy, navigation, CTA pair, and icon strip were compared against the source.
- Focused checks: hero/navigation, six-card product-family grid, manufacturing split frame, four-product grid, three application cards, news row, CTA, and footer.
- Responsive implementation: 3-column category grid under 1050px; 2-column product grid under 900px; single-column card stacks and menu toggle at 720px and below.
- Image delivery: 12 generated images are rendered as WebP (about 2.1 MB total); hero is preloaded and below-the-fold images use native lazy loading.
- Primary links, quote CTAs, WhatsApp, category routes, and product routes remained active. Browser console was clean; lint and production build passed.

## Final result

passed
