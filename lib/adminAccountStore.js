const DEFAULT_EMAIL = "admin@cowinsupply.com";

export function getConfiguredAdminEmail() {
  return String(process.env.ADMIN_EMAIL || DEFAULT_EMAIL).trim().toLowerCase();
}

export function isConfiguredAdminEmail(email) {
  return String(email || "").trim().toLowerCase() === getConfiguredAdminEmail();
}

export function getConfiguredAdminPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  return "";
}

export function isAdminPasswordConfigured() {
  return Boolean(getConfiguredAdminPassword());
}
