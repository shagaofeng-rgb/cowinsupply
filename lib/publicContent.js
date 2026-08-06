export function publicProduct(item) {
  const { legacySourceUrl, legacyDescriptionHtml, sourceFingerprint, eventFingerprint, contentHash, ...safeItem } = item || {};
  return safeItem;
}
