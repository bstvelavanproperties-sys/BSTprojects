import { addLocalLead, getAttribution, getLocalLeads, updateLocalLead } from "./storage.js";

const ADMIN_TOKEN_KEY = "bstv-admin-token";

export const getAdminToken = () =>
  typeof window === "undefined" ? "" : window.localStorage.getItem(ADMIN_TOKEN_KEY) || "";

export const setAdminToken = (token) => {
  if (typeof window !== "undefined") window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
};

export const clearAdminToken = () => {
  if (typeof window !== "undefined") window.localStorage.removeItem(ADMIN_TOKEN_KEY);
};

// Blank in normal use: the site and the API share one origin, so relative /api
// paths just work — in dev too, where Vite proxies /api to the local server. Only
// set VITE_API_BASE_URL if the API is ever moved to its own domain.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(getAdminToken() ? { "x-admin-token": getAdminToken() } : {}),
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`API returned ${contentType || "an unknown response type"}.`);
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error("API returned invalid JSON.");
  }

  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body;
};

// ---------------------------------------------------------------------------
// Read paths degrade to the bundled seed so the site stays browsable if the API
// is unreachable (e.g. a static deploy, or the server restarting).
// ---------------------------------------------------------------------------
let fallbackCache = null;

const fallback = async () => {
  if (!fallbackCache) {
    const [{ properties, defaultContent, reviews }, query] = await Promise.all([
      import("../../../backend/data/properties.js"),
      import("../../../backend/query.js"),
    ]);
    fallbackCache = { properties, defaultContent, reviews, query };
  }
  return fallbackCache;
};

const fallbackList = async (params = {}) => {
  const { properties, query } = await fallback();
  const normalised = query.normaliseQuery(params);
  const filtered = properties.filter((item) => query.matchesInMemory(item, normalised));
  const sorted = query.sortInMemory(filtered, normalised.sort);
  return { ...query.paginate(sorted, normalised), priceIgnored: normalised.priceIgnored, offline: true };
};

const toQueryString = (params) =>
  new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== "" && value !== undefined && value !== null),
  ).toString();

export const fetchProperties = async (params = {}) => {
  try {
    return await request(`/properties?${toQueryString(params)}`);
  } catch {
    return fallbackList(params);
  }
};

export const fetchProperty = async (slug) => {
  try {
    return await request(`/properties/${encodeURIComponent(slug)}`);
  } catch {
    const { properties } = await fallback();
    const found = properties.find((item) => item.slug === slug);
    if (!found) throw new Error("Property not found.");
    return found;
  }
};

export const fetchSimilar = async (slug) => {
  try {
    return await request(`/properties/${encodeURIComponent(slug)}/similar`);
  } catch {
    const { properties } = await fallback();
    const property = properties.find((item) => item.slug === slug);
    if (!property) return [];
    return properties
      .filter(
        (item) =>
          item.slug !== slug &&
          item.city === property.city &&
          item.propertyType === property.propertyType,
      )
      .slice(0, 4);
  }
};

export const fetchPropertyTypes = async () => {
  try {
    return await request("/property-types");
  } catch {
    const { properties, query } = await fallback();
    const counts = properties.reduce(
      (acc, item) => ({ ...acc, [item.propertyType]: (acc[item.propertyType] || 0) + 1 }),
      {},
    );
    return query.PROPERTY_TYPES.map((slug) => ({ slug, count: counts[slug] || 0 }));
  }
};

export const fetchCities = async () => {
  try {
    return await request("/cities");
  } catch {
    const { properties } = await fallback();
    const counts = properties.reduce(
      (acc, item) => ({ ...acc, [item.city]: (acc[item.city] || 0) + 1 }),
      {},
    );
    return Object.entries(counts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count);
  }
};

export const fetchContent = async () => {
  try {
    return await request("/content");
  } catch {
    const { defaultContent } = await fallback();
    return defaultContent;
  }
};

export const fetchReviews = async () => {
  try {
    return await request("/reviews");
  } catch {
    const { reviews } = await fallback();
    return reviews;
  }
};

// ---------------------------------------------------------------------------
// Leads — always mirrored locally so nothing is lost if the API write fails.
// ---------------------------------------------------------------------------
export const submitLead = async (payload) => {
  const body = { ...getAttribution(), ...payload };
  addLocalLead(body);

  try {
    return await request("/leads", { method: "POST", body: JSON.stringify(body) });
  } catch (error) {
    // The local mirror already holds it, and the caller still opens WhatsApp.
    return { message: "Saved locally — we'll be in touch.", offline: true, error: error.message };
  }
};

export const fetchLeads = async () => {
  try {
    const leads = await request("/leads");
    const local = getLocalLeads().filter(
      (lead) => !leads.some((saved) => saved.phone === lead.phone && saved.createdAt === lead.createdAt),
    );
    return [...leads, ...local].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch {
    return getLocalLeads();
  }
};

export const updateLeadStatus = async (id, status) => {
  try {
    return await request(`/leads/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
  } catch {
    updateLocalLead(id, { status });
    return { _id: id, status, offline: true };
  }
};

// ---------------------------------------------------------------------------
// Admin sign-in
// ---------------------------------------------------------------------------
// Reports whether the server requires a login at all, so the panel can stay open
// in local dev where no credentials are configured.
export const fetchAdminSession = () => request("/admin/session");

export const adminLogin = async (username, password) => {
  const result = await request("/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setAdminToken(result.token);
  return result;
};

// ---------------------------------------------------------------------------
// Admin writes
// ---------------------------------------------------------------------------
export const createProperty = (data) =>
  request("/properties", { method: "POST", body: JSON.stringify(data) });

export const updateProperty = (id, data) =>
  request(`/properties/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const deleteProperty = (id) => request(`/properties/${id}`, { method: "DELETE" });

export const importProperties = (rows) =>
  request("/properties/import", { method: "POST", body: JSON.stringify({ rows }) });

export const updateContent = (data) =>
  request("/content", { method: "PATCH", body: JSON.stringify(data) });

export const fetchHealth = () => request("/health");

export const fetchUploadConfig = () => request("/uploads/config");

// Returns a one-time Cloudinary ticket (signature, timestamp, folder). The secret
// that produced it stays on the server.
export const createUploadTicket = (kind) =>
  request("/uploads/signature", { method: "POST", body: JSON.stringify({ kind }) });
