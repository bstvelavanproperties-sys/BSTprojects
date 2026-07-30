// Builds sitemap.xml. Runs as part of `npm run build`.
//
// This used to import backend/data/properties.js — the DEMO fixtures — and emit a
// listing URL for each. The deployed sitemap therefore told Google about 24
// properties that do not exist, which is a self-inflicted crawl of 24 dead URLs and
// exactly the kind of thing that holds back a new domain.
//
// It then read the real inventory straight from MongoDB. That is no longer possible:
// this script now lives in the client workspace, which Vercel builds on its own with
// neither mongoose nor the server package installed. It asks the API instead, over
// the same VITE_API_BASE_URL the browser bundle uses — so a correct frontend config
// implies a correct sitemap, and a Vercel build holds no Atlas credentials at all
// (which is what the previous version's own comment asked for).
//
// With the API unreachable it emits the static pages alone rather than inventing
// entries: a short, correct sitemap beats a long, wrong one.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// The single .env lives at the repo root, one level above this workspace. Plain
// `dotenv/config` would resolve it from process.cwd() — which npm sets to client/ —
// and silently find nothing.
dotenv.config({ path: path.resolve(root, "..", ".env") });
const publicDir = path.join(root, "public");
const origin = (process.env.SITE_ORIGIN || "https://bstvelavanproperties.com").replace(/\/$/, "");
const today = new Date().toISOString().slice(0, 10);

const staticRoutes = [
  ["/", "1.0", "daily"],
  ["/properties", "0.9", "daily"],
  ["/buy", "0.9", "daily"],
  ["/rent", "0.9", "daily"],
  ["/services", "0.7", "monthly"],
  ["/property-wanted", "0.7", "monthly"],
  ["/about", "0.6", "monthly"],
  ["/contact", "0.6", "monthly"],
  ["/faqs", "0.5", "monthly"],
];

// A <loc> carries no escaping of its own, and a slug can in principle contain "&".
const escapeXml = (value) =>
  String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const url = (loc, priority, changefreq, lastmod = today) =>
  `  <url>
    <loc>${escapeXml(origin + loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

// Published listings only. Sold and rented properties stay reachable by URL but are
// deliberately left out of the sitemap — hence the explicit status filter, which
// mirrors the { status: "available" } query this used to run against Mongo directly.
const listingEntries = async () => {
  // Local dev leaves VITE_API_BASE_URL blank and proxies /api to port 5000, so the
  // same blank value has to mean "localhost" here rather than "no API".
  const apiBase = (process.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");

  // The API caps limit at 48 per page, so walk the pages. Bounded so a misbehaving
  // API can never spin the build.
  const PER_PAGE = 48;
  const MAX_PAGES = 50;
  const listings = [];

  try {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const response = await fetch(
        `${apiBase}/api/properties?status=available&limit=${PER_PAGE}&page=${page}`,
        { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15_000) },
      );
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

      const { items = [], pages = 1 } = await response.json();
      listings.push(...items);
      if (page >= pages) break;
    }
  } catch (error) {
    // Never fail the build over a sitemap. A missing listing URL costs a little
    // crawl latency; a failed deploy costs the whole site.
    console.warn(
      `Could not read listings from ${apiBase} (${error.message}) — writing static routes only.`,
    );
    return [];
  }

  return listings
    .filter((listing) => listing.slug)
    .map((listing) =>
      url(
        `/real-estate/${listing.slug}`,
        "0.8",
        "weekly",
        String(listing.updatedAt || today).slice(0, 10),
      ),
    );
};

const entries = [
  ...staticRoutes.map(([loc, priority, changefreq]) => url(loc, priority, changefreq)),
  ...(await listingEntries()),
];

writeFileSync(
  path.join(publicDir, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`,
);

console.log(`Wrote sitemap.xml with ${entries.length} URLs for ${origin}.`);
