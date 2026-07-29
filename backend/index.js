import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import Property from "./models/Property.js";
import Lead, { LEAD_STATUSES, LEAD_TYPES } from "./models/Lead.js";
import SiteContent from "./models/SiteContent.js";
import { properties as seedProperties, defaultContent, reviews } from "./data/properties.js";
import {
  normaliseQuery,
  buildMongoFilter,
  matchesInMemory,
  sortInMemory,
  paginate,
  PROPERTY_TYPES,
} from "./query.js";
import { renderMetaTags, injectMeta } from "./meta.js";
import {
  clearLoginAttempts,
  credentialsConfigured,
  issueSession,
  loginBlocked,
  recordFailedLogin,
  verifyCredentials,
  verifySession,
} from "./auth.js";
import { sendLeadEmail } from "./notify.js";
import { toSqft } from "../shared/units.js";
import { CLOUDINARY_FOLDERS, MAX_PROPERTY_IMAGES, MAX_PROPERTY_VIDEOS } from "../shared/media.js";
import { buildUploadTicket, uploadsConfigured } from "./uploads.js";

const app = express();
// Render terminates TLS at a proxy. Without this every request reports the proxy's
// IP, which would make the login and lead rate limiters throttle all users as one.
app.set("trust proxy", 1);
const port = Number(process.env.PORT) || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../dist");
const isProduction = process.env.NODE_ENV === "production";
const siteName = "BST Velavan Properties";
const origin = process.env.SITE_ORIGIN || `http://localhost:${port}`;

const live = () => mongoose.connection.readyState === 1;

// ---------------------------------------------------------------------------
// In-memory fallback. The whole site works with no database attached.
// ---------------------------------------------------------------------------
const memory = {
  properties: [...seedProperties],
  leads: [],
  content: { ...defaultContent },
};

// This service serves the site AND the API from one origin, so CORS only has to
// permit extras: the Vite dev server during development, or a second domain if the
// site is ever fronted by one. Comma-separated.
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((value) => value.trim().replace(/\/+$/, ""))
  .filter(Boolean);

// Resolved per request rather than from config: on Render the public hostname isn't
// known at boot, and behind the proxy only the forwarded headers carry the real one.
const sameOrigin = (request) => {
  const host = request.get("host");
  return host ? `${request.protocol}://${host}` : "";
};

app.use(
  cors((request, callback) => {
    const allow = (ok) =>
      callback(
        ok ? null : new Error(`Origin not allowed: ${request.headers.origin}`),
        { origin: ok, allowedHeaders: ["Content-Type", "x-admin-token"] },
      );

    const origin = request.headers.origin;
    if (!origin) return allow(true); // curl, server-to-server, plain navigation

    const clean = origin.replace(/\/+$/, "");
    // Same-origin must pass explicitly. Vite marks its bundles crossorigin, so the
    // browser CORS-checks even the app's own JS and CSS; without this the site
    // serves a blank page while curl reports a perfectly healthy 200.
    if (clean === sameOrigin(request)) return allow(true);
    return allow(allowedOrigins.includes(clean));
  }),
);
app.use(express.json({ limit: "1mb" }));

const cleanText = (value, max = 200) => String(value ?? "").trim().slice(0, max);

// The web form posts real arrays; a CSV import posts "a|b" strings for the same
// fields. Both are accepted, which is what the admin's own CSV help text promises.
const toList = (value) => (Array.isArray(value) ? value : String(value ?? "").split("|"));

// Media URLs, de-duplicated and hard-capped. Extras are dropped rather than
// rejected: a CSV import with six photos should import five, not fail the row.
const mediaList = (value, max) => [
  ...new Set(toList(value).map((url) => cleanText(url, 400)).filter(Boolean)),
].slice(0, max);

const slugify = (value) =>
  cleanText(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// "Plot for sale in Velachery" is a title an agency reuses. Suffix on collision.
const uniqueSlug = async (title) => {
  const base = slugify(title) || `property-${Date.now()}`;
  const taken = live()
    ? new Set((await Property.find({ slug: new RegExp(`^${base}(-\\d+)?$`) }, "slug").lean()).map((p) => p.slug))
    : new Set(memory.properties.filter((p) => p.slug?.startsWith(base)).map((p) => p.slug));

  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
};

// Accepts either a session from username/password sign-in, or the legacy static
// ADMIN_TOKEN (kept so scripted imports keep working). With neither configured the
// API stays open — convenient for local dev, unsafe anywhere public, hence the
// boot warning in start().
const requireAdmin = (request, response, next) => {
  const supplied = request.get("x-admin-token") || "";

  if (credentialsConfigured() && verifySession(supplied)) return next();
  if (process.env.ADMIN_TOKEN && supplied === process.env.ADMIN_TOKEN) return next();
  if (!credentialsConfigured() && !process.env.ADMIN_TOKEN) return next();

  return response.status(401).json({ error: "Sign in required." });
};

// ---------------------------------------------------------------------------
// Admin sign-in
// ---------------------------------------------------------------------------
app.get("/api/admin/session", (request, response) => {
  const configured = credentialsConfigured();
  const authenticated = configured ? verifySession(request.get("x-admin-token") || "") : true;
  return response.json({
    configured,
    authenticated,
    // Only echoed back to someone already signed in — handing the username to an
    // anonymous caller would leave only the password to guess.
    username: configured && authenticated ? process.env.ADMIN_USERNAME : "",
  });
});

// Lets the admin UI show the uploader or an explanatory notice, without leaking
// whether Cloudinary is configured to anonymous callers.
app.get("/api/uploads/config", requireAdmin, (_request, response) =>
  response.json({ configured: uploadsConfigured() }),
);

// Admin-gated on purpose: this is the whole reason to sign uploads rather than use
// an unsigned preset. No session, no signature, no upload.
app.post("/api/uploads/signature", requireAdmin, (request, response) => {
  if (!uploadsConfigured()) {
    return response.status(503).json({
      error: "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
    });
  }

  const kind = request.body?.kind === "video" ? "video" : "image";
  // The folder is chosen here, never accepted from the client, and it is part of
  // the signed payload — so uploads cannot be steered elsewhere in the library.
  const folder = CLOUDINARY_FOLDERS[kind];

  return response.json({ ...buildUploadTicket(folder), resourceType: kind });
});

app.post("/api/admin/login", (request, response) => {
  const ip = request.ip || "unknown";

  if (!credentialsConfigured()) {
    return response.status(503).json({ error: "Admin login is not configured on the server." });
  }
  if (loginBlocked(ip)) {
    return response
      .status(429)
      .json({ error: "Too many failed attempts. Try again in 15 minutes." });
  }

  const { username, password } = request.body || {};
  if (!verifyCredentials(username, password)) {
    recordFailedLogin(ip);
    // One message for both cases — naming which half was wrong confirms a username.
    return response.status(401).json({ error: "Incorrect username or password." });
  }

  clearLoginAttempts(ip);
  return response.json(issueSession());
});

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
app.get("/api/health", (_request, response) => {
  response.json({ ok: true, database: live() ? "connected" : "memory-mode" });
});

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------
app.get("/api/properties", async (request, response) => {
  const params = normaliseQuery(request.query);

  try {
    if (live()) {
      const filter = buildMongoFilter(params);
      const [items, total] = await Promise.all([
        Property.find(filter)
          .sort(sortSpec(params.sort))
          .skip((params.page - 1) * params.limit)
          .limit(params.limit)
          .lean(),
        Property.countDocuments(filter),
      ]);
      const pages = Math.max(1, Math.ceil(total / params.limit));
      return response.json({ items, total, page: Math.min(params.page, pages), pages, priceIgnored: params.priceIgnored });
    }

    const filtered = memory.properties.filter((item) => matchesInMemory(item, params));
    const sorted = sortInMemory(filtered, params.sort);
    return response.json({ ...paginate(sorted, params), priceIgnored: params.priceIgnored });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
});

function sortSpec(sort) {
  return (
    {
      newest: { createdAt: -1 },
      "price-asc": { price: 1 },
      "price-desc": { price: -1 },
      "area-asc": { areaSqft: 1 },
      "area-desc": { areaSqft: -1 },
    }[sort] || { createdAt: -1 }
  );
}

app.get("/api/property-types", async (_request, response) => {
  const counts = await countBy("propertyType");
  response.json(PROPERTY_TYPES.map((slug) => ({ slug, count: counts[slug] || 0 })));
});

app.get("/api/cities", async (_request, response) => {
  const counts = await countBy("city");
  response.json(
    Object.entries(counts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city)),
  );
});

async function countBy(field) {
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
}

app.get("/api/properties/:slug", async (request, response) => {
  const property = await findBySlug(request.params.slug);
  if (!property) return response.status(404).json({ error: "Property not found." });
  return response.json(property);
});

app.get("/api/properties/:slug/similar", async (request, response) => {
  const property = await findBySlug(request.params.slug);
  if (!property) return response.status(404).json({ error: "Property not found." });

  const criteria = {
    city: property.city,
    propertyType: property.propertyType,
    listingType: property.listingType,
  };

  if (live()) {
    const items = await Property.find({ ...criteria, status: "available", slug: { $ne: property.slug } })
      .limit(4)
      .lean();
    return response.json(items);
  }

  const items = memory.properties
    .filter(
      (item) =>
        item.slug !== property.slug &&
        item.status === "available" &&
        item.city === criteria.city &&
        item.propertyType === criteria.propertyType,
    )
    .slice(0, 4);
  return response.json(items);
});

async function findBySlug(slug) {
  const clean = cleanText(slug, 140);
  if (live()) return Property.findOne({ slug: clean }).lean();
  return memory.properties.find((item) => item.slug === clean) || null;
}

const normaliseProperty = (body) => ({
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

app.post("/api/properties", requireAdmin, async (request, response) => {
  const data = normaliseProperty(request.body);
  // Price is optional — a listing may go up as Price on Request.
  if (!data.title || !data.city) {
    return response.status(400).json({ error: "Title and city are required." });
  }

  data.slug = await uniqueSlug(data.title);
  data.areaSqft = toSqft(data.areaValue, data.areaUnit);

  try {
    if (live()) {
      const created = await Property.create(data);
      return response.status(201).json(created);
    }
    const created = { _id: data.slug, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    memory.properties.unshift(created);
    return response.status(201).json(created);
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
});

app.patch("/api/properties/:id", requireAdmin, async (request, response) => {
  const data = normaliseProperty(request.body);
  data.areaSqft = toSqft(data.areaValue, data.areaUnit);

  try {
    if (live()) {
      const updated = await Property.findByIdAndUpdate(request.params.id, data, { new: true });
      if (!updated) return response.status(404).json({ error: "Property not found." });
      return response.json(updated);
    }
    const index = memory.properties.findIndex((item) => String(item._id) === request.params.id);
    if (index === -1) return response.status(404).json({ error: "Property not found." });
    memory.properties[index] = {
      ...memory.properties[index],
      ...data,
      slug: memory.properties[index].slug,
      updatedAt: new Date().toISOString(),
    };
    return response.json(memory.properties[index]);
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
});

app.delete("/api/properties/:id", requireAdmin, async (request, response) => {
  try {
    if (live()) {
      const deleted = await Property.findByIdAndDelete(request.params.id);
      if (!deleted) return response.status(404).json({ error: "Property not found." });
      return response.json({ message: "Deleted." });
    }
    const index = memory.properties.findIndex((item) => String(item._id) === request.params.id);
    if (index === -1) return response.status(404).json({ error: "Property not found." });
    memory.properties.splice(index, 1);
    return response.json({ message: "Deleted." });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
});

// Bulk import — an agency's inventory lives in a spreadsheet, not a web form.
app.post("/api/properties/import", requireAdmin, async (request, response) => {
  const rows = Array.isArray(request.body?.rows) ? request.body.rows : [];
  if (!rows.length) return response.status(400).json({ error: "No rows supplied." });

  const results = { created: 0, skipped: 0, errors: [] };

  for (const row of rows.slice(0, 500)) {
    const data = normaliseProperty(row);
    if (!data.title || !data.city) {
      results.skipped += 1;
      results.errors.push(`Skipped "${row.title || "(untitled)"}" — title and city are required.`);
      continue;
    }
    data.slug = await uniqueSlug(data.title);
    data.areaSqft = toSqft(data.areaValue, data.areaUnit);

    try {
      if (live()) {
        await Property.create(data);
      } else {
        memory.properties.unshift({
          _id: data.slug,
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      results.created += 1;
    } catch (error) {
      results.skipped += 1;
      results.errors.push(`${data.title}: ${error.message}`);
    }
  }

  return response.json(results);
});

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------
const rateLimit = new Map(); // ip -> timestamps

const isRateLimited = (ip) => {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const recent = (rateLimit.get(ip) || []).filter((time) => now - time < windowMs);
  recent.push(now);
  rateLimit.set(ip, recent);
  return recent.length > 12;
};

app.post("/api/leads", async (request, response) => {
  // Honeypot: a field no human fills in.
  if (cleanText(request.body?.company)) {
    return response.status(201).json({ message: "Thanks — we'll be in touch." });
  }

  const ip = request.ip || "unknown";
  if (isRateLimited(ip)) {
    return response.status(429).json({ error: "Too many enquiries. Please call us instead." });
  }

  const lead = {
    name: cleanText(request.body.name, 100),
    phone: cleanText(request.body.phone, 24),
    email: cleanText(request.body.email, 160).toLowerCase(),
    message: cleanText(request.body.message, 1200),
    propertyId: cleanText(request.body.propertyId, 140),
    propertyTitle: cleanText(request.body.propertyTitle, 200),
    budget: cleanText(request.body.budget, 60),
    preferredTime: cleanText(request.body.preferredTime, 40),
    type: LEAD_TYPES.includes(request.body.type) ? request.body.type : "enquiry",
    status: "new",
    source: cleanText(request.body.source, 80) || "Direct",
    utmSource: cleanText(request.body.utmSource, 100),
    utmMedium: cleanText(request.body.utmMedium, 100),
    utmCampaign: cleanText(request.body.utmCampaign, 150),
    landingPage: cleanText(request.body.landingPage, 250) || "/",
  };

  const isNewsletter = lead.type === "newsletter";
  if (isNewsletter ? !lead.email : !lead.name || !lead.phone) {
    return response
      .status(400)
      .json({ error: isNewsletter ? "An email address is required." : "Name and phone are required." });
  }

  try {
    const created = live()
      ? (await Lead.create(lead)).toObject()
      : { _id: `lead-${Date.now()}`, ...lead, createdAt: new Date().toISOString() };

    if (!live()) memory.leads.unshift(created);

    // Fire-and-forget: a notification failure must never fail the enquiry.
    const notified = await sendLeadEmail(created);

    return response.status(201).json({ message: "Thanks — we'll be in touch.", lead: created, notified });
  } catch (error) {
    console.error("Could not save lead:", error.message);
    return response.status(500).json({ error: "Could not save the enquiry." });
  }
});

app.get("/api/leads", requireAdmin, async (_request, response) => {
  try {
    const leads = live() ? await Lead.find().sort({ createdAt: -1 }).limit(500).lean() : memory.leads;
    return response.json(leads);
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
});

app.patch("/api/leads/:id", requireAdmin, async (request, response) => {
  if (!LEAD_STATUSES.includes(request.body.status)) {
    return response.status(400).json({ error: "Invalid status." });
  }

  try {
    if (live()) {
      const lead = await Lead.findByIdAndUpdate(request.params.id, { status: request.body.status }, { new: true });
      if (!lead) return response.status(404).json({ error: "Lead not found." });
      return response.json(lead);
    }
    const lead = memory.leads.find((item) => String(item._id) === request.params.id);
    if (!lead) return response.status(404).json({ error: "Lead not found." });
    lead.status = request.body.status;
    return response.json(lead);
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Site content + reviews
// ---------------------------------------------------------------------------
app.get("/api/content", async (_request, response) => {
  if (!live()) return response.json(memory.content);
  const content = await SiteContent.findOne({ key: "homepage" }).lean();
  return response.json({ ...defaultContent, ...(content || {}) });
});

app.patch("/api/content", requireAdmin, async (request, response) => {
  const content = Object.fromEntries(
    Object.keys(defaultContent)
      .filter((key) => key !== "key")
      .map((key) => [key, cleanText(request.body[key] ?? memory.content[key], 400)]),
  );

  try {
    if (live()) {
      const saved = await SiteContent.findOneAndUpdate(
        { key: "homepage" },
        { ...content, key: "homepage" },
        { new: true, upsert: true },
      );
      return response.json(saved);
    }
    memory.content = { ...memory.content, ...content };
    return response.json(memory.content);
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
});

app.get("/api/reviews", (_request, response) => response.json(reviews));

// ---------------------------------------------------------------------------
// Production: static assets + per-listing share previews
// ---------------------------------------------------------------------------
// dist/ is gitignored and built during deploy, so it can legitimately be missing —
// on a fresh clone, or if the build step was skipped. Degrade to API-only rather
// than crashing on boot, and say so loudly enough to be found in the deploy log.
const indexHtml = (() => {
  if (!isProduction) return null;
  try {
    return readFileSync(path.join(distPath, "index.html"), "utf8");
  } catch {
    console.log("No dist/ build found — serving the API only. Run `npm run build`.");
    return null;
  }
})();

if (indexHtml) {
  app.use(express.static(distPath, { index: false }));

  // Crawlers and WhatsApp never run JS — inject the real tags server-side.
  app.get("/real-estate/:slug", async (request, response) => {
    const property = await findBySlug(request.params.slug);
    if (!property) return response.status(404).send(indexHtml);
    const tags = renderMetaTags(property, { origin, siteName });
    return response.type("html").send(injectMeta(indexHtml, tags));
  });

  app.get("*splat", (_request, response) => response.type("html").send(indexHtml));
}

// ---------------------------------------------------------------------------
const start = async () => {
  if (credentialsConfigured()) {
    console.log(`Admin sign-in enabled for user "${process.env.ADMIN_USERNAME}"`);
  } else if (process.env.ADMIN_TOKEN) {
    console.log("Admin gated by static ADMIN_TOKEN (no username/password set)");
  } else if (isProduction) {
    console.warn(
      "WARNING: admin is UNPROTECTED. Set ADMIN_USERNAME and ADMIN_PASSWORD before exposing this API.",
    );
  }

  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("MongoDB connected");
      if ((await Property.countDocuments()) === 0) {
        await Property.insertMany(seedProperties.map(({ _id, ...rest }) => rest));
        console.log(`Seeded ${seedProperties.length} properties`);
      }
    } catch (error) {
      console.warn(`MongoDB unavailable; using memory mode: ${error.message}`);
    }
  } else {
    console.log("MONGODB_URI not set; using memory mode");
  }

  app.listen(port, () => {
    console.log(`${siteName} API running at http://localhost:${port}`);
  });
};

start();
