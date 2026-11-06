import { createHash } from "node:crypto";

const CLIENT_KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BUSINESS_FIELDS = [
  "name", "email", "phone", "company", "product", "productModel", "country",
  "buyerType", "estimatedQuantity", "requiredSpecification", "message"
];

export function inquirySubmissionId(clientKey, fields) {
  if (!CLIENT_KEY.test(String(clientKey || ""))) return null;
  const values = BUSINESS_FIELDS.map((key) => {
    const value = String(fields[key] || "").trim();
    return key === "email" ? value.toLowerCase() : value;
  });
  return "submission-" + createHash("sha256").update(JSON.stringify([clientKey.toLowerCase(), values])).digest("hex");
}
