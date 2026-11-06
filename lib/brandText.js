import { companyProfile } from "@/lib/companyProfile";

// Historical CMS imports can contain a prior legal entity. Keep the public
// rendering boundary authoritative until those records are corrected at source.
const rewrites = [
  ["quzhou", /quzhou\s+daojing\s+import\s*(?:&|&amp;|and)\s*export\s+co\.?[,]?\s*ltd\.?/gi, companyProfile.legalName],
  ["davidsha@cowinsupply.com", /davidsha@cowinsupply\.com/gi, companyProfile.email]
];

export const companyTextRewriteTokens = rewrites.map(([token]) => token);

export function normalizeCompanyText(value = "") {
  return rewrites.reduce((text, [, pattern, replacement]) => text.replace(pattern, replacement), String(value));
}
