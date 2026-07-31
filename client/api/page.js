// Vercel function: server-rendered <head> for the static routes.
//
// WHY THIS EXISTS
// api/share.js solves this for one route, /real-estate/:slug. Everything else served the
// app shell verbatim, so /buy, /nri, /services and the rest all shipped the homepage's
// <title> and description. React fixes it after boot; crawlers largely do not wait, and a
// set of pages that look identical to Google is a set of pages Google declines to index
// separately.
//
// Unlike the share function this one calls no API and touches no database — everything it
// needs is a static table in shared/pageMeta.js — so it cannot fail on an API outage and
// adds no latency beyond fetching the shell.

import { injectMeta } from "@bstv/shared/meta.js";
import { isMetaRoute, renderPageMeta, SITE_NAME } from "@bstv/shared/pageMeta.js";

import brand, { services } from "../src/config/brand.js";

const siteOrigin = (process.env.SITE_ORIGIN || "").replace(/\/+$/, "");

export default async function handler(request, response) {
  const origin = siteOrigin || `https://${request.headers.host}`;

  // The rewrite passes the matched route through as ?path=. Only paths present in the
  // pageMeta table are honoured, so nothing arbitrary can be reflected into the HTML.
  const path = String(request.query?.path || "/").slice(0, 80);

  // Rewrites do not recurse, so asking for /index.html returns the built static file
  // rather than re-entering this function.
  const shellResponse = await fetch(`${origin}/index.html`);
  const shell = await shellResponse.text();

  // Any failure serves the unmodified shell: React then boots and renders the page
  // normally. Weaker tags are a bad snippet; a 500 is a dead page.
  const serveShell = (reason) => {
    if (reason) console.warn(`Page meta fell back to the plain shell: ${reason}`);
    return response
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .setHeader("Cache-Control", "public, max-age=0, s-maxage=600, stale-while-revalidate=86400")
      .status(200)
      .send(shell);
  };

  if (!isMetaRoute(path)) return serveShell(`no meta entry for "${path}"`);

  try {
    const tags = renderPageMeta(path, { origin, siteName: SITE_NAME, brand, services });

    return response
      .setHeader("Content-Type", "text/html; charset=utf-8")
      // Longer than the share function's 5 minutes: this copy is a static table in the
      // bundle, so it only changes on deploy.
      .setHeader("Cache-Control", "public, max-age=0, s-maxage=600, stale-while-revalidate=86400")
      .status(200)
      .send(injectMeta(shell, tags));
  } catch (error) {
    return serveShell(error.message);
  }
}
