import { AREA_UNITS, unitLabel } from "../../shared/units.js";
import { formatFullINR, formatINR, priceParts, priceText } from "../../shared/money.js";

export { AREA_UNITS, unitLabel, formatINR, formatFullINR, priceParts, priceText };

export const formatArea = (property) => {
  if (!property.areaValue) return "";
  return `${Number(property.areaValue).toLocaleString("en-IN")} ${unitLabel(property.areaUnit)}`;
};

export const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// EMI = P·r·(1+r)^n / ((1+r)^n − 1)
export const calculateEmi = (principal, annualRate, years) => {
  const p = Number(principal) || 0;
  const n = (Number(years) || 0) * 12;
  const r = (Number(annualRate) || 0) / 12 / 100;

  if (p <= 0 || n <= 0) return { emi: 0, total: 0, interest: 0 };
  if (r === 0) return { emi: p / n, total: p, interest: 0 };

  const factor = (1 + r) ** n;
  const emi = (p * r * factor) / (factor - 1);
  const total = emi * n;
  return { emi, total, interest: total - p };
};

export const cloudinaryUrl = (url, width) => {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/w_${width},f_auto,q_auto/`);
};

export const propertyImage = (property, width = 800) => {
  const first = property?.images?.[0];
  if (!first) return "/assets/properties/placeholder.svg";
  return cloudinaryUrl(first, width);
};

export const listingTypeLabel = (type) => (type === "rent" ? "For Rent" : "For Sale");
