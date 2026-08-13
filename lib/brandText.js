import { companyProfile } from "@/lib/companyProfile";

// Historical CMS imports can contain a prior legal entity. Keep the public
// rendering boundary authoritative until those records are corrected at source.
const LEGACY_LEGAL_NAME = /quzhou\s+daojing\s+import\s*(?:&|&amp;|and)\s*export\s+co\.?[,]?\s*ltd\.?/gi;

export function normalizeCompanyText(value = "") {
  return String(value).replace(LEGACY_LEGAL_NAME, companyProfile.legalName);
}
