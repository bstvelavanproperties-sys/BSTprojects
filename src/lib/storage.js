// Browser-side persistence: attribution, analytics events, saved shortlist, and the lead
// fallback used when the API is unreachable.

const KEYS = {
  leads: "bstv-leads",
  events: "bstv-events",
  saved: "bstv-saved",
};

const read = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  try {
    const value = JSON.parse(window.localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota or private mode — non-fatal */
    }
  }
  return value;
};

export const getAttribution = () => {
  if (typeof window === "undefined") return { source: "Direct" };

  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer || "";
  const from = (needle) => referrer.includes(needle);

  const source =
    params.get("utm_source") ||
    (from("google") && "Google") ||
    (from("instagram") && "Instagram") ||
    (from("facebook") && "Facebook") ||
    (from("youtube") && "YouTube") ||
    (from("wa.me") || from("whatsapp") ? "WhatsApp" : "") ||
    (referrer ? "Referral" : "Direct");

  return {
    source,
    utmSource: params.get("utm_source") || "",
    utmMedium: params.get("utm_medium") || "",
    utmCampaign: params.get("utm_campaign") || "",
    landingPage: `${window.location.pathname}${window.location.search}`,
  };
};

export const getEvents = () => read(KEYS.events, []);

export const track = (name, properties = {}) => {
  if (typeof window === "undefined") return;

  const event = {
    id: globalThis.crypto?.randomUUID?.() || `event-${Date.now()}`,
    name,
    createdAt: new Date().toISOString(),
    path: window.location.pathname,
    ...getAttribution(),
    ...properties,
  };

  write(KEYS.events, [event, ...getEvents()].slice(0, 500));

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...properties });
  if (typeof window.gtag === "function") window.gtag("event", name, properties);
};

// Local mirror of submitted leads — also the fallback when the API is down.
export const getLocalLeads = () => read(KEYS.leads, []);

export const addLocalLead = (payload) => {
  const lead = {
    _id: globalThis.crypto?.randomUUID?.() || `lead-${Date.now()}`,
    status: "new",
    createdAt: new Date().toISOString(),
    ...getAttribution(),
    ...payload,
    local: true,
  };
  write(KEYS.leads, [lead, ...getLocalLeads()].slice(0, 300));
  return lead;
};

export const updateLocalLead = (id, changes) => {
  const leads = getLocalLeads().map((lead) => (lead._id === id ? { ...lead, ...changes } : lead));
  write(KEYS.leads, leads);
  return leads;
};

export const getSaved = () => read(KEYS.saved, []);

export const toggleSaved = (slug) => {
  const saved = getSaved();
  const next = saved.includes(slug) ? saved.filter((item) => item !== slug) : [...saved, slug];
  write(KEYS.saved, next);
  return next;
};

export const exportLeadsCsv = (leads) => {
  const fields = [
    "createdAt",
    "name",
    "phone",
    "email",
    "type",
    "status",
    "propertyTitle",
    "budget",
    "preferredTime",
    "message",
    "source",
    "utmSource",
    "utmMedium",
    "utmCampaign",
    "landingPage",
  ];

  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [
    fields.join(","),
    ...leads.map((lead) => fields.map((field) => quote(lead[field])).join(",")),
  ].join("\n");

  download(csv, `bst-velavan-leads-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
};

export const PROPERTY_CSV_FIELDS = [
  "title",
  "listingType",
  "propertyType",
  "labels",
  "status",
  "price",
  "pricePrefix",
  "priceSuffix",
  "priceNote",
  "bedrooms",
  "bathrooms",
  "areaValue",
  "areaUnit",
  "facing",
  "furnishing",
  "locationText",
  "locality",
  "city",
  "state",
  "pincode",
  "amenities",
  "images",
  "featured",
  "description",
];

export const exportPropertiesCsv = (properties) => {
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const cell = (property, field) =>
    Array.isArray(property[field]) ? property[field].join("|") : property[field];

  const csv = [
    PROPERTY_CSV_FIELDS.join(","),
    ...properties.map((property) =>
      PROPERTY_CSV_FIELDS.map((field) => quote(cell(property, field))).join(","),
    ),
  ].join("\n");

  download(csv, `bst-velavan-properties-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
};

// Minimal RFC-4180 parser — enough for the round-trip our own export produces.
export const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows.filter((r) => r.some((c) => c !== ""));
  if (!header) return [];

  const arrayFields = new Set(["labels", "amenities", "images"]);
  const numberFields = new Set(["price", "bedrooms", "bathrooms", "areaValue"]);

  return body.map((cells) =>
    Object.fromEntries(
      header.map((key, index) => {
        const value = cells[index] ?? "";
        if (arrayFields.has(key)) return [key, value ? value.split("|").filter(Boolean) : []];
        if (numberFields.has(key)) return [key, Number(value) || 0];
        if (key === "featured") return [key, value === "true"];
        return [key, value];
      }),
    ),
  );
};

function download(content, filename, type) {
  const href = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }));
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(href);
}
