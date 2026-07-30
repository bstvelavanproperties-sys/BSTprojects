import { getAttribution } from "./storage.js";

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
// Reads
// ---------------------------------------------------------------------------
// These used to fall back to the bundled demo seed whenever a request threw, which
// made a completely dead backend indistinguishable from a healthy one: the site
// rendered 24 invented listings and nothing anywhere said so. With the API on Render
// and the site on Vercel that is a live risk, not a theoretical one — a wrong
// VITE_API_BASE_URL produces exactly that failure at every request.
//
// Errors now propagate so the UI can say the catalogue is unavailable. It also drops
// the cross-boundary `import("../../../backend/...")` that used to pull server fixtures
// into the browser bundle.
const toQueryString = (params) =>
  new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== "" && value !== undefined && value !== null),
  ).toString();

export const fetchProperties = (params = {}) => request(`/properties?${toQueryString(params)}`);

export const fetchProperty = (slug) => request(`/properties/${encodeURIComponent(slug)}`);

export const fetchSimilar = (slug) => request(`/properties/${encodeURIComponent(slug)}/similar`);

export const fetchPropertyTypes = () => request("/property-types");

export const fetchCities = () => request("/cities");

export const fetchContent = () => request("/content");

export const fetchReviews = () => request("/reviews");

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------
// A failed submission used to be mirrored into the visitor's own localStorage and
// answered with "Saved locally — we'll be in touch." Nothing could make that true:
// the record sat in the enquirer's browser, on their device, where the agency could
// never see it. The admin list then merged those local entries, so the only ones
// that ever appeared were the operator's own test submissions sitting alongside real
// database leads.
//
// The genuine second channel is the prefilled WhatsApp link the form opens, which
// travels over a completely separate path. So a write failure is now reported as a
// failure, and the caller falls back to WhatsApp.
export const submitLead = async (payload) =>
  request("/leads", {
    method: "POST",
    body: JSON.stringify({ ...getAttribution(), ...payload }),
  });

export const fetchLeads = () => request("/leads");

export const updateLeadStatus = (id, status) =>
  request(`/leads/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });

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
