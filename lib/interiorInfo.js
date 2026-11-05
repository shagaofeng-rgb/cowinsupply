import { companyJsonLd, companyProfile } from "@/lib/companyProfile";
import {
  MAP_URL, SITE_URL, breadcrumbs, button, escapeHtml, icon, inquiryForm, interiorPage, kicker, media, pageHeading, textLink, whatsappButton
} from "@/lib/interiorRendering";

const contactLinks = [
  ["mail", "Email sales", companyProfile.email, `mailto:${companyProfile.email}`],
  ["brand-whatsapp", "WhatsApp", companyProfile.phone, companyProfile.whatsAppUrl],
  ["map-pin", "Company location", "Company location · Google Maps", MAP_URL]
];

export function renderAbout() {
  const heading = "Power tool supply for distributor programs";
  const description = "Learn about Cowin Supply and Quzhou Qiying Import & Export Co., Ltd., supplier of professional power tools for global distributors.";
  const support = [
    ["list-details", "Product selection", "Review available power tools by application and model."],
    ["clipboard-check", "Application review", "Share your working requirements to confirm configurations and accessories."],
    ["package", "Wholesale planning", "Discuss models, order quantities and packaging requirements for your market."]
  ];
  return interiorPage({
    title: "About | Cowin Supply", description, canonical: `${SITE_URL}/about`, active: "/about", schema: companyJsonLd(),
    body: `<main class="cw-wrap cw-page" id="main-content">${breadcrumbs([["About"]])}
      <div class="cw-about-hero">
        <div class="cw-info-copy">${kicker("About Cowin Supply")}<h1>${heading}</h1>
          <p class="cw-small">Operated by ${escapeHtml(companyProfile.legalName)}</p>
          <p class="cw-lead">We source and supply power tools for distributor programs and help buyers select models for their applications and wholesale requirements.</p>
          <div class="cw-actions">${button("Explore products", "/product", { graphic: "arrow-right" })}${button("Contact our team", "/contact#quote", { secondary: true })}</div>
        </div>
        <figure>${media("/cowin-assets/scene-detail-application.jpg", "Wall chaser held against a masonry surface", { eager: true })}<figcaption>Illustrative tool application</figcaption></figure>
      </div>
      <section class="cw-support"><h2>How we support buyers</h2><div class="cw-support-grid">${support.map(([graphic, label, copy]) =>
        `<article>${icon(graphic)}<h3>${label}</h3><p>${copy}</p></article>`
      ).join("")}</div></section>
    </main>`
  });
}

export function renderContact() {
  const heading = "Send a distributor inquiry";
  const description = "Tell us your product, target market and expected quantity.";
  return interiorPage({
    title: "Contact | Cowin Supply", description, canonical: `${SITE_URL}/contact`, active: "/contact", schema: companyJsonLd(),
    body: `<main class="cw-wrap cw-page" id="main-content">${breadcrumbs([["Contact"]])}${pageHeading("Sales inquiries", heading, description)}
      <div class="cw-contact-layout" id="quote" tabindex="-1">${inquiryForm()}
        <aside class="cw-contact-side" aria-label="Sales contacts and inquiry guidance">
          <section class="cw-contact-card cw-contact-links"><h2>${escapeHtml(companyProfile.legalName)}</h2><ul>
            ${contactLinks.map(([graphic, mobileLabel, label, href], index) =>
              `<li><a href="${escapeHtml(href)}"${index ? ' target="_blank" rel="noopener noreferrer"' : ""}>${icon(graphic)}<span class="cw-contact-desktop-label">${escapeHtml(label)}</span><span class="cw-contact-mobile-label">${escapeHtml(mobileLabel)}</span><span class="cw-contact-arrow">${icon("arrow-right")}</span></a></li>`
            ).join("")}
          </ul></section>
          <section class="cw-contact-card cw-contact-guidance"><h2>What to include</h2><ul>
            <li>${icon("file-description")}Product model or application</li>
            <li>${icon("package")}Quantity and destination</li>
            <li>${icon("bolt")}Voltage and accessories</li>
          </ul></section>
        </aside>
      </div>
      <section class="cw-map"><div><h2>${icon("map-pin")}Company location</h2>
        <a class="cw-text-link" href="${MAP_URL}" target="_blank" rel="noopener noreferrer">Get directions ${icon("arrow-right")}</a></div>
        <iframe title="Cowin Supply company location on Google Maps" src="https://www.google.com/maps?q=28.965204,118.839750&amp;z=16&amp;output=embed" width="1200" height="450" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      </section>
    </main>`
  });
}

export function renderInquiryStatus(success) {
  const heading = success ? "Inquiry received" : "Your inquiry status";
  const description = success
    ? "Our sales team will review the product, market and configuration details you provided."
    : "Return to the contact page to send an inquiry or contact our sales team directly.";
  return interiorPage({
    title: `${heading} | Cowin Supply`, description, robots: "noindex,follow", active: "/contact", compactFooter: true,
    body: `<main class="cw-wrap cw-status-page" id="main-content">${breadcrumbs([["Contact", "/contact"], ["Inquiry"]])}
      <section class="cw-status${success ? " cw-status-success" : ""}"><div>
        <div class="cw-status-icon">${icon(success ? "circle-check" : "info-circle")}${kicker("Inquiry status")}</div>
        <h1>${heading}</h1><p class="cw-lead">${description}</p>
        <div class="cw-actions">${success ? `${button("View products", "/product")}${button("Send another inquiry", "/contact#quote", { secondary: true, graphic: "mail" })}${whatsappButton("Chat on WhatsApp")}`
          : `${button("Return to inquiry form", "/contact#quote")}${whatsappButton("Chat on WhatsApp")}${textLink("Browse products", "/product")}`}
        </div>
      </div></section>
    </main>`
  });
}
