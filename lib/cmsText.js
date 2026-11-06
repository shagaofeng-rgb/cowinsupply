import { companyTextRewriteTokens, normalizeCompanyText } from "@/lib/brandText";

const editorialRewrites = [
  ["&amp;ldquo;", '"'], ["&amp;rdquo;", '"'], ["&ldquo;", '"'], ["&rdquo;", '"'],
  ["鈥", "..."], ["鈥?", '"']
];

// A body without these tokens is unchanged by the public text normalization.
export const cmsBodyRewriteTokens = [...companyTextRewriteTokens, ...editorialRewrites.map(([token]) => token)];

export function normalizeCmsText(value) {
  return editorialRewrites.reduce((text, [token, replacement]) => text.replaceAll(token, replacement), normalizeCompanyText(value));
}
