import { AREA_UNITS, unitLabel } from "../../../shared/units.js";
import { formatFullINR, formatINR, isPriceOnRequest, priceParts, priceText } from "../../../shared/money.js";
import { defaultPropertyImage } from "../../../shared/propertyImages.js";

export { AREA_UNITS, unitLabel, formatINR, formatFullINR, isPriceOnRequest, priceParts, priceText };

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

const VIDEO_EXT = /\.(mp4|mov|webm|m4v|avi|mkv|ogv)(\?.*)?$/i;

// A video is anything Cloudinary filed under /video/upload/, plus any hand-pasted
// URL with a video extension. Kept loose on purpose: the admin can paste a URL from
// anywhere, and mislabelling one only affects which tag renders it.
export const isVideoUrl = (url) => Boolean(url) && (/\/video\/upload\//.test(url) || VIDEO_EXT.test(url));

// Cloudinary renders a still from any frame of a video when you ask for an image
// extension. so_0 takes the first frame — the reliable choice, since a percentage
// offset on a very short clip can land past the end and 404.
export const cloudinaryPoster = (url, width) => {
  if (!url || !url.includes("/upload/")) return url;
  return url
    .replace("/upload/", `/upload/so_0,w_${width},c_fill,q_auto/`)
    .replace(VIDEO_EXT, ".jpg");
};

export const propertyImage = (property, width = 800) => {
  const first = property?.images?.[0];
  if (!first) return defaultPropertyImage(property?.propertyType);
  return cloudinaryUrl(first, width);
};

export const listingTypeLabel = (type) => (type === "rent" ? "For Rent" : "For Sale");
