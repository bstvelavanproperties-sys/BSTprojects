// Builds sitemap.xml from the seed inventory. Runs as part of `npm run build`, so the
// sitemap can't drift from the listings that actually exist.
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { properties } from "../backend/data/properties.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "frontend", "public");
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

const url = (loc, priority, changefreq, lastmod = today) =>
  `  <url>
    <loc>${origin}${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

const entries = [
  ...staticRoutes.map(([loc, priority, changefreq]) => url(loc, priority, changefreq)),
  ...properties
    .filter((property) => property.status === "available")
    .map((property) =>
      url(
        `/real-estate/${property.slug}`,
        "0.8",
        "weekly",
        String(property.updatedAt || today).slice(0, 10),
      ),
    ),
];

writeFileSync(
  path.join(publicDir, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`,
);

console.log(`Wrote sitemap.xml with ${entries.length} URLs.`);
