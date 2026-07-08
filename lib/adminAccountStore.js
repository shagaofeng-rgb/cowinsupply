const DEFAULT_EMAIL = "admin@cowinsupply.com";
const LOCAL_DEFAULT_PASSWORD = "CowinSupply@2026";

export function getConfiguredAdminEmail() {
  return String(process.env.ADMIN_EMAIL || DEFAULT_EMAIL).trim().toLowerCase();
}

export function isConfiguredAdminEmail(email) {
  return String(email || "").trim().toLowerCase() === getConfiguredAdminEmail();
}

export function getConfiguredAdminPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (process.env.ADMIN_DEFAULT_PASSWORD) return process.env.ADMIN_DEFAULT_PASSWORD;
  if (process.env.NODE_ENV !== "production") return LOCAL_DEFAULT_PASSWORD;
  return "";
}

export function isAdminPasswordConfigured() {
  return Boolean(getConfiguredAdminPassword());
}

export function localAdminHint() {
  if (process.env.NODE_ENV === "production") return null;
  return {
    email: getConfiguredAdminEmail(),
    password: LOCAL_DEFAULT_PASSWORD
  };
}
