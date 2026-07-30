// Vercel function: server-rendered share previews for listing pages.
//
// WHY THIS EXISTS
// WhatsApp, Facebook and X never execute JavaScript. A React SPA that sets its
// <head> at runtime therefore shows the same generic homepage card for every
// property ever shared — and in this market WhatsApp forwarding is how listings
// actually travel, so that is a real loss rather than a cosmetic one.
//
// When Render served both the API and the HTML, the Express server handled this
// directly. With the site on Vercel, Vercel serves the HTML, so the injection has to
// happen here. client/vercel.json rewrites /real-estate/:slug to this function.
//
// It shares one implementation with the Express path: shared/meta.js renders the
// tags, so the two cannot drift apart.

import { injectMeta, renderMetaTags } from "@bstv/shared/meta.js";

const SITE_NAME = "BST Velavan Properties";

// Where to fetch the listing from. VITE_API_BASE_URL is the same variable the
// browser bundle uses, so a correct frontend implies a correct function.
const apiBase = (process.env.VITE_API_BASE_URL || process.env.API_BASE_URL || "").replace(/\/+$/, "");
const siteOrigin = (process.env.SITE_ORIGIN || "").replace(/\/+$/, "");

export default async function handler(request, response) {
  // The rewrite passes the slug through as a query parameter. Constrained to the
  // shape slugify() produces in server/src/lib/normalise.js, so nothing else can reach the
  // fetch below or be reflected into the HTML.
  const slug = String(request.query?.slug || "").slice(0, 140);
  const origin = siteOrigin || `https://${request.headers.host}`;

  // Fetch the app shell Vercel has already built. Rewrites do not recurse, so
  // asking for /index.html here returns the static file rather than this function.
  const shellResponse = await fetch(`${origin}/index.html`);
  const shell = await shellResponse.text();

  // Any failure below serves the unmodified shell: React then boots and renders the
  // page normally. A missing preview is a bad share card; a 500 is a broken link.
  const serveShell = (reason) => {
    if (reason) console.warn(`Share preview fell back to the plain shell: ${reason}`);
    return response
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=86400")
      .status(200)
      .send(shell);
  };

  if (!/^[a-z0-9-]+$/.test(slug)) return serveShell(`rejected slug "${slug}"`);
  if (!apiBase) return serveShell("VITE_API_BASE_URL is not set");

  try {
    // Short timeout: a crawler that waits is a crawler that gives up. Better to
    // return the plain shell fast than stall the whole preview.
    const listing = await fetch(`${apiBase}/api/properties/${encodeURIComponent(slug)}`, {
      signal: AbortSignal.timeout(4000),
      headers: { accept: "application/json" },
    });

    if (!listing.ok) return serveShell(`API returned ${listing.status} for ${slug}`);

    const property = await listing.json();
    const tags = renderMetaTags(property, { origin, siteName: SITE_NAME });

    return response
      .setHeader("Content-Type", "text/html; charset=utf-8")
      // Cached at the edge for 5 minutes so a listing shared into a busy group does
      // not become one origin request per recipient, while an edited price still
      // propagates quickly.
      .setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=86400")
      .status(200)
      .send(injectMeta(shell, tags));
  } catch (error) {
    return serveShell(error.message);
  }
}
