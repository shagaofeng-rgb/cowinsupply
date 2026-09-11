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

## Final result

passed
