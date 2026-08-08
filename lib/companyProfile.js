import profile from "@/data/companyProfile.json";

export const companyProfile = Object.freeze({
  ...profile,
  phoneHref: `tel:${String(profile.phone || "").replace(/[^+\d]/g, "")}`
});

export function companyJsonLd() {
  const sameAs = profile.whatsAppUrl ? [profile.whatsAppUrl] : [];
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: profile.legalName,
    alternateName: profile.brandName,
    url: "https://www.cowinsupply.com",
    email: profile.email,
    telephone: profile.phone,
    ...(profile.addressStatus === "confirmed" && profile.address
      ? { address: { "@type": "PostalAddress", streetAddress: profile.address, addressCountry: "CN" } }
      : {}),
    ...(sameAs.length ? { sameAs } : {})
  };
}
