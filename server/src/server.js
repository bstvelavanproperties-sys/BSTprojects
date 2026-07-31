import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { renderMetaTags, injectMeta } from "@bstv/shared/meta.js";
import { isMetaRoute, renderPageMeta } from "@bstv/shared/pageMeta.js";

import {
  clientOrigins,
  mongoUri,
  port,
  production as isProduction,
  siteOrigin,
  tokenConfigured,
  validateEnvironment,
} from "./config/env.js";
import { credentialsConfigured } from "./middleware/auth.js";
import { findBySlug } from "./lib/properties.js";
import authRoutes from "./routes/auth.js";
import contentRoutes from "./routes/content.js";
import healthRoutes from "./routes/health.js";
import leadRoutes from "./routes/leads.js";
import propertyRoutes, { catalogueRouter } from "./routes/properties.js";
import uploadRoutes from "./routes/uploads.js";

// Refuses to start on a misconfiguration that would be insecure or serve fake data
// as real. Runs before anything is wired up so the process dies with a readable
// list rather than half-booting. See config/env.js.
validateEnvironment();

const app = express();
// Render terminates TLS at a proxy. Without this every request reports the proxy's
// IP, which would make the login and lead rate limiters throttle all users as one.
app.set("trust proxy", 1);
// Don't advertise the framework; it is free reconnaissance for a scanner.
app.disable("x-powered-by");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../../client/dist");
const siteName = "BST Velavan Properties";
const origin = siteOrigin;

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------
// The site's own HTML is served by Vercel, whose headers are configured in
// client/vercel.json — these two must be kept in step. This copy covers API
// responses and the share-preview HTML this service renders directly.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // No 'unsafe-inline' / 'unsafe-eval'. The GA snippet in main.jsx builds its
        // script element from the bundle rather than inlining, so it needs only the
        // host. JSON-LD is a <script type="application/ld+json"> data block, which
        // CSP does not treat as executable, so meta.js is unaffected.
        scriptSrc: ["'self'", "https://www.googletagmanager.com"],
        // Tailwind v4 compiles to a static stylesheet, so 'self' is enough for
        // <style>. The attribute variant is separate and does need unsafe-inline:
        // React renders `style={{…}}` props as inline style attributes (11 of them,
        // mostly the Preloader's animation timings). Style attributes cannot
        // execute script, so this is a much weaker allowance than script-src would be.
        styleSrc: ["'self'"],
        styleSrcAttr: ["'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
        mediaSrc: ["'self'", "https://res.cloudinary.com"],
        fontSrc: ["'self'"], // @fontsource is bundled, not fetched from a CDN
        connectSrc: [
          "'self'",
          ...clientOrigins,
          "https://api.cloudinary.com", // direct signed uploads
          "https://www.google-analytics.com",
          "https://region1.google-analytics.com",
        ],
        frameSrc: ["https://maps.google.com", "https://www.google.com"], // location embed
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"], // clickjacking: nothing may frame /admin
        upgradeInsecureRequests: isProduction ? [] : null,
      },
    },
    // Renders share-preview images and Cloudinary media cross-origin without
    // requiring COEP on every embedded asset.
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Two years, subdomains included. Render already serves https; this stops the
    // first plain-http request from ever leaving the browser.
    hsts: isProduction
      ? { maxAge: 63_072_000, includeSubDomains: true, preload: true }
      : false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
// With the frontend on Vercel and this API on Render these are different origins,
// so this is a real access-control boundary rather than the dev convenience it was
// when one service served both. config/env.js requires CLIENT_ORIGIN in production.
const sameOrigin = (request) => {
  const host = request.get("host");
  return host ? `${request.protocol}://${host}` : "";
};

const originAllowed = (request) => {
  const requestOrigin = request.headers.origin;
  if (!requestOrigin) return true; // curl, server-to-server, plain navigation — not a browser CORS case

  const clean = requestOrigin.replace(/\/+$/, "");
  // Same-origin must pass explicitly. Vite marks its bundles crossorigin, so the
  // browser CORS-checks even the app's own JS and CSS; without this the site
  // serves a blank page while curl reports a perfectly healthy 200.
  return clean === sameOrigin(request) || clientOrigins.includes(clean);
};

app.use(
  cors((request, callback) =>
    // Never call back with an Error. The old version did, which Express 5 turned
    // into a 500 with a stack trace instead of a clean rejection. Reporting
    // origin:false omits the CORS headers, which is what actually makes the
    // browser block the response.
    callback(null, {
      origin: originAllowed(request),
      allowedHeaders: ["Content-Type", "x-admin-token"],
      maxAge: 86_400,
    }),
  ),
);

app.use(express.json({ limit: "1mb" }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use("/api/health", healthRoutes);
app.use("/api/admin", authRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api", catalogueRouter); // /api/property-types, /api/cities
app.use("/api/leads", leadRoutes);
app.use("/api", contentRoutes); // /api/content, /api/reviews

// ---------------------------------------------------------------------------
// Optional: serve the built site from this service too
// ---------------------------------------------------------------------------
// In the current deployment this block does nothing. Vercel builds and serves the
// site (client/vercel.json), and Render only runs the API — so client/dist is never
// built here and indexHtml stays null.
//
// It is kept deliberately, because it is the entire fallback if you ever want to
// collapse back to one service: run the client build on Render and this serves the
// SPA plus proper per-listing share previews with no other changes. Under the split
// deploy that preview rendering lives in client/api/share.js instead, and both call
// the same @bstv/shared/meta.js so the two cannot drift.
const indexHtml = (() => {
  if (!isProduction) return null;
  try {
    return readFileSync(path.join(distPath, "index.html"), "utf8");
  } catch {
    // Expected in the split deploy. Not a warning — the API is what should be running.
    return null;
  }
})();

if (indexHtml) {
  console.log("Found client/dist — also serving the built site from this service.");
  app.use(express.static(distPath, { index: false }));

  // Crawlers and WhatsApp never run JS — inject the real tags server-side.
  app.get("/real-estate/:slug", async (request, response) => {
    const property = await findBySlug(request.params.slug);
    if (!property) return response.status(404).send(indexHtml);
    const tags = renderMetaTags(property, { origin, siteName });
    return response.type("html").send(injectMeta(indexHtml, tags));
  });

  // Static routes get their own title, description, canonical and structured data, the same
  // way client/api/page.js does it on Vercel — both call renderPageMeta, so the two deploys
  // cannot drift. brand config is loaded lazily because it lives in the client workspace,
  // which only exists in this single-service configuration.
  const brandConfig = await import("../../client/src/config/brand.js").catch(() => null);

  app.get("*splat", (request, response) => {
    const path = request.path;
    if (!isMetaRoute(path)) return response.type("html").send(indexHtml);

    const tags = renderPageMeta(path, {
      origin,
      siteName,
      brand: brandConfig?.default,
      services: brandConfig?.services,
    });
    return response.type("html").send(injectMeta(indexHtml, tags));
  });
}

// ---------------------------------------------------------------------------
const start = async () => {
  if (credentialsConfigured()) {
    console.log(`Admin sign-in enabled for user "${process.env.ADMIN_USERNAME}"`);
  } else if (tokenConfigured) {
    console.log("Admin gated by static ADMIN_TOKEN (no username/password set)");
  } else {
    // Only reachable outside production — config/env.js exits before this in production.
    console.log("Admin is open (development only, no credentials configured)");
  }

  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri);
      console.log("MongoDB connected");

      // The auto-seed that used to live here inserted 24 demo listings into any
      // empty database, which meant a fresh production database came up populated
      // with fictional inventory that then had to be found and deleted by hand.
      // Seeding is now explicit and refuses to run against production:
      //   npm run seed
    } catch (error) {
      // In production this is fatal: config/env.js already established that a
      // database is required, so continuing would mean serving an empty catalogue
      // as if the agency had no listings.
      if (isProduction) {
        console.error(`Could not connect to MongoDB: ${error.message}`);
        process.exit(1);
      }
      console.warn(`MongoDB unavailable; using in-memory seed data: ${error.message}`);
    }
  } else {
    console.log("MONGODB_URI not set; using in-memory seed data (development only)");
  }

  app.listen(port, () => {
    console.log(`${siteName} API running at http://localhost:${port}`);
  });
};

start();
