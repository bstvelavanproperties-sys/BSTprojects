import { MAX_PROPERTY_IMAGES, MAX_PROPERTY_VIDEOS } from "@bstv/shared/media.js";
import { isClosedStatus } from "@bstv/shared/saleStage.js";

import Property from "../models/Property.js";
import { live, memory } from "./memory.js";
import { cleanText, mediaList, toList } from "./normalise.js";
import { PROPERTY_TYPES } from "./query.js";

export const sortSpec = (sort) =>
  ({
    newest: { createdAt: -1 },
    "price-asc": { price: 1 },
    "price-desc": { price: -1 },
    "area-asc": { areaSqft: 1 },
    "area-desc": { areaSqft: -1 },
  })[sort] || { createdAt: -1 };

export const countBy = async (field) => {
  if (live()) {
    const rows = await Property.aggregate([
      { $match: { status: "available" } },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    ]);
    return Object.fromEntries(rows.map((row) => [row._id, row.count]));
  }
  return memory.properties
    .filter((item) => item.status === "available")
    .reduce((acc, item) => ({ ...acc, [item[field]]: (acc[item[field]] || 0) + 1 }), {});
};

// Also used by the share-preview path in server.js, which is why it lives here
// rather than inside the route module.
export const findBySlug = async (slug) => {
  const clean = cleanText(slug, 140);
  if (live()) return Property.findOne({ slug: clean }).lean();
  return memory.properties.find((item) => item.slug === clean) || null;
};

/**
 * What `closedAt` should become on a write, given where the property was and where it
 * is going. The three rules, in order:
 *
 *   back on the market   -> null      (a re-listed property is not a closed one)
 *   was already closed   -> unchanged (editing a sold listing must not restart the
 *                                      3-day window; a legacy null stays null, so a
 *                                      historic sale is not re-announced as a new deal)
 *   just closed          -> now
 */
export const nextClosedAt = (previousStatus, nextStatus, previousClosedAt) => {
  if (!isClosedStatus(nextStatus)) return null;
  if (isClosedStatus(previousStatus)) return previousClosedAt ?? null;
  return new Date();
};

// NOTE: `closedAt` is deliberately absent below. It is decided by nextClosedAt() from
// the stored status, never taken from the request — otherwise a caller could backdate a
// sale straight past the "selling process" window.
export const normaliseProperty = (body) => ({
  title: cleanText(body.title, 160),
  description: cleanText(body.description, 4000),
  listingType: body.listingType === "rent" ? "rent" : "sale",
  propertyType: PROPERTY_TYPES.includes(body.propertyType) ? body.propertyType : "plot",
  labels: toList(body.labels)
    .map((label) => cleanText(label, 20))
    .filter((label) => ["residential", "commercial"].includes(label)),
  status: ["available", "sold", "rented"].includes(body.status) ? body.status : "available",
  price: Number(body.price) || 0,
  hidePrice: Boolean(body.hidePrice),
  pricePrefix: cleanText(body.pricePrefix, 40),
  priceSuffix: cleanText(body.priceSuffix, 60),
  priceNote: cleanText(body.priceNote, 60),
  bedrooms: Number(body.bedrooms) || 0,
  bathrooms: Number(body.bathrooms) || 0,
  areaValue: Number(body.areaValue) || 0,
  areaUnit: ["sqft", "ground", "cent", "acre"].includes(body.areaUnit) ? body.areaUnit : "sqft",
  facing: cleanText(body.facing, 40),
  furnishing: cleanText(body.furnishing, 40),
  locationText: cleanText(body.locationText, 240),
  locality: cleanText(body.locality, 100),
  city: cleanText(body.city, 80),
  state: cleanText(body.state, 80) || "Tamil Nadu",
  pincode: cleanText(body.pincode, 10),
  latitude: body.latitude === "" || body.latitude === undefined ? undefined : Number(body.latitude),
  longitude: body.longitude === "" || body.longitude === undefined ? undefined : Number(body.longitude),
  images: mediaList(body.images, MAX_PROPERTY_IMAGES),
  videos: mediaList(body.videos, MAX_PROPERTY_VIDEOS),
  amenities: toList(body.amenities).map((a) => cleanText(a, 60)).filter(Boolean),
  featured: Boolean(body.featured),
  verified: body.verified !== false,
});
