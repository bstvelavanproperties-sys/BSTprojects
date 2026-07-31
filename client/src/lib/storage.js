// Browser-side persistence: campaign attribution, the visitor's saved shortlist, and
// the CSV import/export helpers the admin panel uses.

const KEYS = {
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

// Forwards an event to Google Analytics, when GA is configured at all.
//
// This used to also append every event to a 500-entry ring buffer in localStorage
// under "bstv-events". Nothing ever read it back — getEvents() had no callers
// anywhere in the app — so it was writing to each visitor's disk on every page view
// and click for no purpose. GA is the only consumer, and it already has this data.
export const track = (name, properties = {}) => {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...properties });
  if (typeof window.gtag === "function") window.gtag("event", name, properties);
};

export const getSaved = () => read(KEYS.saved, []);

export const toggleSaved = (slug) => {
  const saved = getSaved();
  const next = saved.includes(slug) ? saved.filter((item) => item !== slug) : [...saved, slug];
  write(KEYS.saved, next);
  return next;
};

// Spreadsheet formula injection. Excel, Numbers and Sheets all execute a cell whose
// text begins with = + - @ (or a tab/CR that resolves to one), so a lead who types
// =HYPERLINK("http://evil","click") into the message field gets that formula live in
// the file YOU open. Quoting alone does not help — the formula is inside the quotes.
//
// A leading apostrophe forces the cell to text, which every major spreadsheet honours
// and which displays as the original string.
const RISKY_PREFIX = /^[=+\-@\t\r]/;

const csvCell = (value) => {
  const text = String(value ?? "");
  const safe = RISKY_PREFIX.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
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

  const csv = [
    fields.join(","),
    ...leads.map((lead) => fields.map((field) => csvCell(lead[field])).join(",")),
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
  "videos",
  "featured",
  "description",
];

export const exportPropertiesCsv = (properties) => {
  const cell = (property, field) =>
    Array.isArray(property[field]) ? property[field].join("|") : property[field];

  const csv = [
    PROPERTY_CSV_FIELDS.join(","),
    ...properties.map((property) =>
      PROPERTY_CSV_FIELDS.map((field) => csvCell(cell(property, field))).join(","),
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
