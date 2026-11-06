import { categoryPath, getTaxonomyItem, PRODUCT_TAXONOMY, productCategoryName } from "@/lib/catalogTaxonomy";
import { companyJsonLd, companyProfile } from "@/lib/companyProfile";
import { SITE_URL, assetUrl, breadcrumbs, button, escapeHtml, icon, inquiryForm, interiorPage, kicker, media, pageHeading, textLink, whatsappButton } from "@/lib/interiorRendering";

const categoryIcons = {
  "cutting-tools": ["blade", "Cutting"],
  "drilling-tools": ["hammer-drill", "Drilling"],
  "wall-chasers-concrete-cutting": ["wall", "Wall Chasers", "wall-chasers"],
  "surface-finishing-tools": ["layers-subtract", "Surface Finishing"],
  "measuring-tools": ["ruler-2", "Measuring"],
  "precision-tools": ["ruler-measure", "Precision"]
};
const categoryUrl = slug => `/products/${encodeURIComponent(slug)}`;
const productUrl = product => `/product/${encodeURIComponent(product.slug)}.html`;
const specsFor = product => (product.specifications || []).filter(item => item?.label && item?.value && item.verified === true);
const labelKey = label => label.toLowerCase().replace(/[^a-z0-9]/g, "");
const priority = ["ratedpower", "bladediameter", "maxcuttingdepth", "maximumcuttingdepth"];
const formatted = value => escapeHtml(value).replace(/(\d)(W|V|Hz|mm|kg)(?=\b)/g, "$1 $2");

function summarySpecs(specs) {
  return [...specs].sort((a, b) => {
    const order = item => priority.includes(labelKey(item.label)) ? priority.indexOf(labelKey(item.label)) : priority.length;
    return order(a) - order(b);
  });
}

function displayName(product) {
  const name = product.title || "";
  const model = product.model || "";
  if (!model || !name.toLowerCase().startsWith(model.toLowerCase())) return name;
  return name.slice(model.length).replace(/^\s*[-–:·]?\s*/, "").replace(/^\d+\s*W\s+/i, "") || name;
}

const catalogImageSizes = "(max-width: 600px) calc(100vw - 38px), (max-width: 980px) 45vw, (max-width: 1400px) 30vw, 416px";

function productCard(product, { compact = false, position = Infinity, storefront = false } = {}) {
  const href = productUrl(product);
  const spec = summarySpecs(specsFor(product))[0];
  return `<article class="cw-product-card${compact ? " cw-product-card-compact" : ""}">
    <a class="cw-card-media-link" href="${href}" aria-label="View ${escapeHtml(product.title)}">${media(product.image || product.gallery?.[0], product.title, {
      product: true, eager: storefront ? position === 0 : position < 3,
      priority: position === 0, storefrontSizes: storefront ? catalogImageSizes : ""
    })}</a>
    <div class="cw-card-copy">
      ${kicker(compact ? productCategoryName(product) : product.model || productCategoryName(product))}
      <h3><a href="${href}">${escapeHtml(compact ? product.model || product.title : displayName(product))}</a></h3>
      ${spec ? `<p class="cw-card-spec">${formatted(spec.value)}<span class="cw-sr"> ${escapeHtml(spec.label)}</span></p>` : '<p class="cw-card-spec">Technical sheet on request</p>'}
      ${compact ? button("View details", href, { secondary: true, graphic: "arrow-right" }) : textLink("View details", href)}
    </div>
  </article>`;
}

function categoryTiles() {
  return `<nav class="cw-category-tiles" aria-label="Product categories">${Object.entries(categoryIcons).map(([slug, [graphic, label, target]]) =>
    `<a href="${categoryUrl(target || slug)}">${icon(graphic)}<span>${escapeHtml(label)}</span></a>`
  ).join("")}</nav>`;
}

export function renderProductListHtml({ products, query = "", category = "" }) {
  const validCategory = getTaxonomyItem(category);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const selected = products.filter(product => {
    const groups = categoryPath(product.categorySlug);
    const index = [product.title, product.model, product.category, ...groups.map(item => item.name), product.summary].filter(Boolean).join(" ").toLowerCase();
    return (!validCategory || groups.some(item => item.slug === category)) && terms.every(term => index.includes(term));
  });
  const description = "Find professional power tools by application or model.";
  return interiorPage({
    title: `Product Catalog | ${companyProfile.brandName}`, description, canonical: `${SITE_URL}/product`,
    ...(query || validCategory ? { robots: "noindex,follow" } : {}), active: "/product", stylesInHead: true,
    body: `<main class="cw-wrap cw-page" id="main-content">
      ${breadcrumbs([["Products"]])}
      ${pageHeading("Product catalog", "Product Catalog", description)}
      ${categoryTiles()}
      <form class="cw-catalog-filter" action="/product" role="search" aria-label="Search the product catalog">
        <a class="cw-filter-all${!query && !validCategory ? " is-selected" : ""}" href="/product">All products</a>
        <label class="cw-search-field">${icon("search")}<span class="cw-sr">Model or tool</span><input type="search" name="q" placeholder="Search model or tool" maxlength="120" value="${escapeHtml(query)}"></label>
        <label><span class="cw-sr">Product category</span><select name="category"><option value="">All categories</option>${PRODUCT_TAXONOMY.map(item => `<option value="${item.slug}"${item.slug === category ? " selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select></label>
        <button class="cw-button cw-button-dark" type="submit">Search</button>
      </form>
      <p class="cw-result-count">${selected.length} ${selected.length === 1 ? "product" : "products"}${query ? ` for “${escapeHtml(query)}”` : ""}${validCategory ? ` in ${escapeHtml(validCategory.name)}` : ""}</p>
      ${selected.length ? `<section class="cw-product-grid" aria-label="Products"><h2 class="cw-sr">Products</h2>${selected.map((product, position) => productCard(product, { position, storefront: true })).join("")}</section>` : `<div class="cw-empty">${icon("search")}<h2>No matching products</h2><p>Try a different model number, tool name or category.</p>${button("Clear filters", "/product", { secondary: true })}</div>`}
    </main>`
  });
}

function groupLinks(config) {
  const parent = config.parent && getTaxonomyItem(config.parent);
  const family = PRODUCT_TAXONOMY.filter(item => item.parent === (parent?.slug || config.slug));
  const group = family.length ? [...family, ...(parent ? [parent] : [config])] : [config, ...PRODUCT_TAXONOMY.filter(item => !item.parent && item.slug !== config.slug)];
  return `<details class="cw-side-nav" data-collapsible-wide open><summary>Browse tools${icon("chevron-down")}</summary>
    <nav aria-label="Product categories">${group.map(item => `<a href="${categoryUrl(item.slug)}"${item.slug === config.slug ? ' aria-current="page"' : ""}>${escapeHtml(item.name)}</a>`).join("")}<a href="/product">All products</a></nav>
  </details>`;
}

function comparison(products) {
  const comparable = products.filter(product => specsFor(product).length).slice(0, 4);
  if (comparable.length < 2) return "";
  const byProduct = comparable.map(product => new Map(specsFor(product).map(item => [labelKey(item.label), item.value])));
  const rows = summarySpecs(specsFor(comparable[0])).filter(item => byProduct.every(spec => spec.has(labelKey(item.label)))).slice(0, 3);
  if (!rows.length) return "";
  return `<section class="cw-comparison"><h2>Compare verified specifications</h2><div class="cw-table-scroll" tabindex="0" role="region" aria-label="Model comparison table">
    <table><thead><tr><th scope="col">Specification</th>${comparable.map(product => `<th scope="col"><a href="${productUrl(product)}">${escapeHtml(product.model || product.title)}</a></th>`).join("")}</tr></thead>
    <tbody>${rows.map(item => `<tr><th scope="row">${escapeHtml(item.label)}</th>${byProduct.map(spec => `<td>${formatted(spec.get(labelKey(item.label)))}</td>`).join("")}</tr>`).join("")}</tbody></table>
  </div>${textLink("Ask for model guidance", "/contact#quote")}</section>`;
}

export function renderProductCategoryHtml({ config, products }) {
  const trail = categoryPath(config.slug);
  const parent = trail.length > 1 ? trail[0] : null;
  return interiorPage({
    title: `${config.name} | ${companyProfile.brandName}`, description: config.description,
    canonical: `${SITE_URL}${categoryUrl(config.slug)}`, active: "/product",
    body: `<main class="cw-wrap cw-page" id="main-content">
      ${breadcrumbs([["Products", "/product"], ...trail.map(item => [item.name, item.slug === config.slug ? "" : categoryUrl(item.slug)])])}
      <div class="cw-category-banner">${pageHeading(parent?.name || "Product category", config.name, config.description)}</div>
      <div class="cw-category-layout">${groupLinks(config)}
        <div>${products.length ? `<section class="cw-product-grid" aria-label="${escapeHtml(config.name)}"><h2 class="cw-sr">Models</h2>${products.map((product, position) => productCard(product, { compact: true, position })).join("")}</section>${comparison(products)}` : `<div class="cw-empty">${icon("blade")}<h2>No models listed yet</h2><p>Tell us what you need, or browse the full product catalog.</p><div class="cw-actions">${button("Browse products", "/product")}${button("Contact sales", "/contact#quote", { secondary: true })}</div></div>`}</div>
      </div>
    </main>`
  });
}

function galleryBlock(product, gallery) {
  const label = product.model || product.title;
  return `<div class="cw-detail-gallery"${gallery.length > 1 ? ' data-multi-gallery' : ""}>
    ${gallery.length > 1 ? `<div class="cw-gallery-thumbs" role="group" aria-label="Product views">${gallery.map((src, index) =>
      `<button type="button" data-gallery-src="${escapeHtml(src)}" data-gallery-alt="${escapeHtml(`${label} product photo ${index + 1}`)}" aria-pressed="${index === 0}" aria-label="Show product photo ${index + 1} of ${gallery.length}">${media(src, "", { product: true })}</button>`
    ).join("")}</div>` : ""}
    <div class="cw-gallery-main">${media(gallery[0], `${label} product photo`, { product: true, eager: true })}
      ${gallery.length > 1 ? `<button type="button" class="cw-gallery-zoom" data-gallery-zoom aria-label="View full-size product photo">${icon("zoom-in")}</button>` : ""}
    </div>
    ${gallery.length > 1 ? `<dialog class="cw-gallery-dialog" aria-label="Full-size product photo"><form method="dialog"><button class="cw-button cw-button-secondary" type="submit" autofocus>Close</button></form><img alt=""></dialog>` : ""}
  </div>`;
}

function checklist() {
  return `<aside class="cw-checklist"><h3>Quotation checklist</h3><ul>
    <li>${icon("wall")}Working material</li><li>${icon("bolt")}Target market and voltage</li><li>${icon("package")}Quantity and accessories</li>
  </ul></aside>`;
}

function pendingNotice() {
  return `<div class="cw-notice">${icon("file-description")}<div><strong>Technical sheet on request</strong><p>Ask sales to confirm the current configuration for this model.</p>${textLink("Request specifications", "#inquiry")}</div></div>`;
}

const sectionNav = [["Overview", "overview"], ["Specifications", "specifications"], ["Applications", "applications"], ["FAQ", "faq"], ["Get quote", "inquiry"]];

export function renderProductDetailHtml({ product, relatedProducts = [], relatedNews = [] }) {
  const category = getTaxonomyItem(product.categorySlug);
  const trail = categoryPath(product.categorySlug);
  const gallery = [...new Set([product.image, ...(product.gallery || [])].map(assetUrl).filter(Boolean))];
  const specs = specsFor(product);
  const quick = summarySpecs(specs).slice(0, 3);
  const features = (product.features || []).filter(Boolean);
  const applications = (product.applications || []).filter(Boolean);
  const faqs = product.faq?.length >= 5 ? product.faq.slice(0, 6) : defaultFaqs(product);
  const pageUrl = `${SITE_URL}${productUrl(product)}`;
  const crumbs = trail.map((item, index) => ({ "@type": "ListItem", position: index + 3, name: item.name, item: `${SITE_URL}${categoryUrl(item.slug)}` }));
  const schema = productPageSchema({ product, category, gallery, specs, faqs, crumbs, pageUrl });
  const description = product.seoDescription || product.summary || "Request current product documentation and a distributor quotation.";
  return interiorPage({
    title: product.seoTitle || `${product.title} | ${companyProfile.brandName}`,
    description, canonical: pageUrl, image: gallery[0], schema, active: "/product",
    ...(product.seoIndexable === false ? { robots: "noindex,follow" } : {}),
    body: `<main class="cw-wrap cw-page cw-detail" id="main-content">
      ${breadcrumbs([["Products", "/product"], ...trail.map(item => [item.name, categoryUrl(item.slug)]), [product.model || product.title]])}
      <div class="cw-detail-hero">
        <div class="cw-detail-heading">${kicker(category?.name || productCategoryName(product))}<h1>${product.model ? `<span class="cw-model">${escapeHtml(product.model)}</span>` : ""}<span class="cw-product-name">${escapeHtml(displayName(product))}</span></h1></div>
        ${galleryBlock(product, gallery)}
        <div class="cw-detail-intro">
          <p class="cw-lead">${escapeHtml(product.summary || product.geoSummary || description)}</p>
          ${quick.length ? `<dl class="cw-quick-specs">${quick.map(item => `<div><dt>${escapeHtml(item.label)}</dt><dd>${formatted(item.value)}</dd></div>`).join("")}</dl>` : pendingNotice()}
          <div class="cw-actions">${button("Request a quote", "#inquiry")}${whatsappButton()}</div>
          <p class="cw-small">Confirm voltage, plug and accessories with sales.</p>
        </div>
      </div>
      <nav class="cw-section-nav" aria-label="On this product page">${sectionNav.map(([label, id]) => `<a href="#${id}"${id === "specifications" ? ' aria-current="location"' : ""}>${label}</a>`).join("")}</nav>
      <section id="specifications" class="cw-detail-section cw-detail-split">
        <div><h2>Technical specifications</h2>${specs.length ? `<div class="cw-table-scroll"><table aria-label="Verified technical specifications"><tbody>${specs.map(item => `<tr><th scope="row">${escapeHtml(item.label)}</th><td>${formatted(item.value)}</td></tr>`).join("")}</tbody></table></div>` : pendingNotice()}</div>${checklist()}
      </section>
      <section id="overview" class="cw-detail-section"><h2>Overview</h2><p>${escapeHtml(product.productIntroduction || product.summary || description)}</p>
        <section id="performance"><h3>Performance</h3><p>${escapeHtml(product.performance || "Request the current technical sheet for model-specific performance data.")}</p></section>
        <section id="features"><h3>Features and configuration</h3>${features.length ? `<ul class="cw-detail-list">${features.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "<p>Confirm the accessory set and configuration with sales for your order.</p>"}</section>
      </section>
      <section id="applications" class="cw-detail-section"><h2>Applications</h2>
        ${applications.length ? `<ul class="cw-application-grid">${applications.map(item => `<li>${icon("clipboard-check")}${escapeHtml(item)}</li>`).join("")}</ul>` : "<p>Share the working material and intended application with sales to confirm suitability.</p>"}
      </section>
      <section id="faq" class="cw-detail-section cw-faq"><h2>Buyer questions</h2>${faqs.map(item => `<details><summary>${escapeHtml(item.question)}${icon("chevron-down")}</summary><p>${escapeHtml(item.answer)}</p></details>`).join("")}</section>
      ${relatedProducts.length ? `<section class="cw-detail-section"><h2>Related products</h2><div class="cw-product-grid">${relatedProducts.map(item => productCard(item, { compact: true })).join("")}</div></section>` : ""}
      ${relatedNews.length ? `<section class="cw-detail-section"><h2>Product briefings</h2><ul class="cw-detail-list">${relatedNews.map(item => `<li>${textLink(item.title, `/news/${encodeURIComponent(item.slug)}`)}</li>`).join("")}</ul></section>` : ""}
      <section id="inquiry" class="cw-product-inquiry" tabindex="-1">
        <aside class="cw-inquiry-product">${media(gallery[0], product.title, { product: true })}
          <div>${kicker("Selected model")}<h3>${escapeHtml(product.model ? `${product.model} · ${displayName(product)}` : product.title)}</h3><p>Share your material, target market and order quantity.</p>${whatsappButton()}</div>
        </aside>
        <div>${kicker("Request a product quotation")}<h2>Request a product quotation</h2>${inquiryForm(product, pageUrl)}<p class="cw-small cw-inquiry-note">The selected model and product page are included with your inquiry.</p></div>
      </section>
      <div class="cw-mobile-quote" data-mobile-quote>${button("Request a quote", "#inquiry")}${whatsappButton("WhatsApp")}</div>
    </main>`
  });
}

function productPageSchema({ product, category, gallery, specs, faqs, crumbs, pageUrl }) {
  const offer = verifiedOffer(product);
  const graph = [
    companyJsonLd(),
    {
      "@type": "WebPage",
      name: product.title,
      description: product.seoDescription || product.summary,
      primaryImageOfPage: gallery[0] || undefined,
      url: pageUrl,
      isPartOf: { "@type": "WebSite", name: companyProfile.brandName, url: SITE_URL }
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Products", item: `${SITE_URL}/product` },
        ...crumbs,
        { "@type": "ListItem", position: crumbs.length + 3, name: product.title, item: pageUrl }
      ]
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer }
      }))
    }
  ];

  // Google requires a verifiable commercial signal for Product rich results.
  // Cowin Supply is quote-led, so never manufacture a price or availability.
  // Product JSON-LD is emitted only when a future catalog record contains a
  // complete, verified offer.
  if (offer) {
    graph.splice(2, 0, {
      "@type": "Product",
      name: product.title,
      description: product.summary || product.seoDescription,
      image: gallery,
      url: pageUrl,
      sku: product.model || undefined,
      category: category?.name || product.category,
      brand: { "@type": "Brand", name: companyProfile.brandName },
      additionalProperty: specs.map((item) => ({ "@type": "PropertyValue", name: item.label, value: item.value })),
      offers: offer
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

function verifiedOffer(product) {
  const price = String(product.offerPrice || "").trim();
  const priceCurrency = String(product.offerCurrency || "").trim().toUpperCase();
  const availability = String(product.offerAvailability || "").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(price) || !/^[A-Z]{3}$/.test(priceCurrency) || !availability) return null;
  const normalizedAvailability = availability.startsWith("https://schema.org/")
    ? availability
    : `https://schema.org/${availability}`;
  if (!/^https:\/\/schema\.org\/(InStock|OutOfStock|PreOrder|BackOrder|LimitedAvailability)$/u.test(normalizedAvailability)) return null;
  return { "@type": "Offer", price, priceCurrency, availability: normalizedAvailability, url: `${SITE_URL}/product/${product.slug}.html` };
}

function defaultFaqs(product) { const model = product.model ? ` for ${product.model}` : ""; return [{ question: `How can I request current specifications${model}?`, answer: "Send the intended application, material, voltage and expected quantity through the enquiry form. Cowin Supply can return the current model-specific documentation for review." }, { question: "Can this product be quoted for wholesale purchase?", answer: "Yes. Provide the destination market, buyer type, required configuration and estimated order quantity so the quotation can be based on the applicable record." }, { question: "Which voltage should I select?", answer: "Voltage and frequency must be confirmed for the destination market before quotation. Do not rely on a historical listing as the final electrical specification." }, { question: "Are accessories included?", answer: "Accessory contents can vary by configuration. Ask Cowin Supply to confirm the current package and compatible accessories before the order is approved." }, { question: "Can I use the displayed image as a final configuration reference?", answer: "The image identifies the catalog product, but the final configuration, accessories and technical details should be confirmed in the current product documentation." }, { question: "How do I compare related models?", answer: "Use the related product links, then send the application and performance requirements for a like-for-like configuration comparison." }]; }
