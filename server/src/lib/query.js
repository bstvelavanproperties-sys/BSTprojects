// The single source of truth for filtering. Mongo translates the normalised object into a
// query; the in-memory store applies it as plain predicates. Both must agree — see the
// filter-parity check in the README.

export const PROPERTY_TYPES = [
  "plot",
  "villa",
  "apartment",
  "independent-house",
  "commercial-space",
  "farm-house-land",
];

export const LISTING_TYPES = ["sale", "rent"];
export const LABELS = ["residential", "commercial"];
export const STATUSES = ["available", "sold", "rented"];

export const SORTS = {
  newest: { createdAt: -1 },
  "price-asc": { price: 1 },
  "price-desc": { price: -1 },
  "area-asc": { areaSqft: 1 },
  "area-desc": { areaSqft: -1 },
};

const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const oneOf = (value, allowed) => (allowed.includes(value) ? value : undefined);

export const normaliseQuery = (query = {}) => {
  const listingType = oneOf(query.listingType, LISTING_TYPES);
  const minPrice = num(query.minPrice);
  const maxPrice = num(query.maxPrice);

  // Sale prices (₹50L–₹6Cr) and monthly rents (₹15K–₹1.5L) share one field, so an
  // unscoped price range is meaningless — drag it to ₹1Cr and every rental vanishes.
  const priceScoped = Boolean(listingType);

  return {
    q: String(query.q || "").trim().slice(0, 120),
    city: String(query.city || "").trim().slice(0, 80),
    listingType,
    propertyType: oneOf(query.propertyType, PROPERTY_TYPES),
    label: oneOf(query.label, LABELS),
    status: oneOf(query.status, STATUSES),
    // Opt-in: include sold/rented alongside available. Only the browsing pages and the
    // admin table set it — see the note in buildMongoFilter.
    includeClosed: query.includeClosed === "true",
    bedrooms: num(query.bedrooms),
    minPrice: priceScoped ? minPrice : undefined,
    maxPrice: priceScoped ? maxPrice : undefined,
    priceIgnored: !priceScoped && (minPrice !== undefined || maxPrice !== undefined),
    featured: query.featured === "true" ? true : undefined,
    sort: SORTS[query.sort] ? query.sort : "newest",
    page: Math.max(1, num(query.page) || 1),
    limit: Math.min(48, Math.max(1, num(query.limit) || 12)),
  };
};

export const buildMongoFilter = (params) => {
  const filter = {};

  if (params.q) filter.$text = { $search: params.q };
  if (params.city) filter.city = new RegExp(`^${escapeRegex(params.city)}$`, "i");
  if (params.listingType) filter.listingType = params.listingType;
  if (params.propertyType) filter.propertyType = params.propertyType;
  if (params.label) filter.labels = params.label;
  if (params.bedrooms !== undefined) filter.bedrooms = { $gte: params.bedrooms };
  if (params.featured) filter.featured = true;

  // Status, in precedence order:
  //   an explicit ?status=  -> exactly that
  //   ?includeClosed=true   -> everything, sold and rented included
  //   otherwise             -> available only
  //
  // The default stays available-only on purpose. The homepage carousels, the
  // affordability results and the matchmaker all query without a status, and none of
  // them should ever recommend a property that is no longer for sale. Only the browsing
  // pages and the admin table opt in.
  if (params.status) filter.status = params.status;
  else if (!params.includeClosed) filter.status = "available";

  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    filter.price = {};
    if (params.minPrice !== undefined) filter.price.$gte = params.minPrice;
    if (params.maxPrice !== undefined) filter.price.$lte = params.maxPrice;
  }

  return filter;
};

export const matchesInMemory = (item, params) => {
  if (params.city && String(item.city).toLowerCase() !== params.city.toLowerCase()) return false;
  if (params.listingType && item.listingType !== params.listingType) return false;
  if (params.propertyType && item.propertyType !== params.propertyType) return false;
  if (params.label && !(item.labels || []).includes(params.label)) return false;
  if (params.featured && !item.featured) return false;
  if (params.bedrooms !== undefined && Number(item.bedrooms || 0) < params.bedrooms) return false;
  // Mirrors the three-way rule in buildMongoFilter — the two paths must agree.
  const status = item.status || "available";
  if (params.status) {
    if (status !== params.status) return false;
  } else if (!params.includeClosed && status !== "available") {
    return false;
  }
  if (params.minPrice !== undefined && Number(item.price) < params.minPrice) return false;
  if (params.maxPrice !== undefined && Number(item.price) > params.maxPrice) return false;

  if (params.q) {
    const haystack = `${item.title} ${item.locationText} ${item.locality} ${item.city}`.toLowerCase();
    const needles = params.q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!needles.every((needle) => haystack.includes(needle))) return false;
  }

  return true;
};

export const sortInMemory = (items, sort) => {
  const [field, direction] = {
    newest: ["createdAt", -1],
    "price-asc": ["price", 1],
    "price-desc": ["price", -1],
    "area-asc": ["areaSqft", 1],
    "area-desc": ["areaSqft", -1],
  }[sort] || ["createdAt", -1];

  return [...items].sort((a, b) => {
    // Available stock first, whatever the chosen sort. A property that sold yesterday
    // would otherwise sit at the top of "newest" and push live inventory down.
    const rank = closedRank(a) - closedRank(b);
    if (rank !== 0) return rank;

    const left = field === "createdAt" ? new Date(a[field] || 0).getTime() : Number(a[field] || 0);
    const right = field === "createdAt" ? new Date(b[field] || 0).getTime() : Number(b[field] || 0);
    return (left - right) * direction;
  });
};

const closedRank = (item) => ((item.status || "available") === "available" ? 0 : 1);

export const paginate = (items, params) => {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / params.limit));
  const page = Math.min(params.page, pages);
  const start = (page - 1) * params.limit;
  return { items: items.slice(start, start + params.limit), total, page, pages };
};

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
