# BST Velavan Properties

A property website for BST Velavan Properties — *Building Trust. Creating Value.*
React + Vite front end, Express + MongoDB API, Tailwind CSS.

The layout follows the kavinrealestate.com reference supplied as screenshots, rendered in
BST Velavan's red/navy/gold brand.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

- Site: `http://localhost:5173`
- API: `http://localhost:5000`
- Admin: `http://localhost:5173/admin`

**MongoDB is optional.** With `MONGODB_URI` blank the API serves 24 seed listings from memory and
the front end falls back to browser storage, so everything is demonstrable with zero setup. Set
`MONGODB_URI` and the same data seeds into Mongo automatically on first boot.

## Production

**One service.** A single Node process serves the website and the API from the same origin —
there is no separate frontend host.

```bash
npm run build   # regenerates sitemap.xml, then builds to dist/
npm start       # Express serves dist/ AND /api on :5000
```

Deployment is `render.yaml` (Blueprint). It runs `npm install --include=dev && npm run build`,
then `npm start`. The `--include=dev` matters: `NODE_ENV=production` makes npm skip
devDependencies, and Vite lives there, so without it the build fails with `vite: not found`.

Set these in the Render dashboard — everything else is optional:

| Variable | Why |
|---|---|
| `SITE_ORIGIN` | The public domain. Wrong value breaks share previews and `sitemap.xml` silently. |
| `MONGODB_URI` | Without it the site runs on seed data and forgets every change on restart. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Set both, or `/admin` is unprotected. |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Photo and video uploads. Server-side only; read at runtime, so a change needs a restart, not a rebuild. |

`CLIENT_ORIGIN` is *not* needed in production. The service's own origin always passes CORS; that
variable only adds extra origins, which local dev needs because Vite runs on a different port.

Single-origin hosting is what makes the server-rendered share previews work at all — see below.

## The four things other property sites don't have

**Property Matchmaker (`/find-my-property`)** — five questions (buy/rent, type, city, budget, and
bedrooms only when the type has any) that return live matches. Results come *first*; the
name-and-phone capture sits underneath them, never in front. If nothing matches exactly it widens
the search rather than showing a dead end. This is the main lead-generation surface.

**Compare (up to 3)** — a Compare toggle on every property card opens a docked bar and a
side-by-side table. It computes **price per sq.ft** across mixed area units and marks the strongest
value in each row (lowest price and rate, highest area, bedrooms, amenities). Ties are not
highlighted, and the footnote states it isn't a recommendation.

**Affordability (`/affordability`)** — the inverse of a normal EMI calculator. Instead of *"here's
the EMI on this house"* it asks what you can pay monthly and solves backwards for the property
price, then shows what's actually available in that range:
`P = EMI · ((1+r)ⁿ − 1) / (r · (1+r)ⁿ)`.

**Branded preloader** — the "Vel" mark draws itself over a rising skyline, on **every page load and
every internal navigation**. Two timings, both constants at the top of
`frontend/src/components/Preloader.jsx`:

```js
const FIRST_MS = 1400;  // initial load and every reload — full animation
const ROUTE_MS = 700;   // navigating between pages — same animation, condensed
```

The navigation run is deliberately shorter: a full-length overlay on every click reads as a broken
site. Raise `ROUTE_MS` to `1400` if you want them identical. The overlay is skippable, locks
scrolling only while fully opaque, scrolls the new page to the top underneath itself, and is
**skipped entirely for `prefers-reduced-motion`** — a full-screen animation on every navigation is
exactly what that setting exists to prevent. Scroll-reveal on card grids is motion-safe too.

## What's included

**Public site** — home (hero search, trust strip, type carousel, featured grid, matchmaker teaser,
platform, services, rentals, testimonials, CTA), listings with filters, property detail, matchmaker,
affordability, services, about, contact, property-wanted, FAQs.

**Listings** — filter by keyword, city, type, category, bedrooms and price; sort by price/area/date;
paginated. All filter state lives in the URL, so results are shareable and back/forward works.

**Property detail** — media gallery with lightbox, spec table, amenities, map, EMI calculator,
enquiry form, similar properties, shortlist and share.

**Uploads are signed, not unsigned.** The browser asks `POST /api/uploads/signature` — which
requires an admin session — for a short-lived Cloudinary signature, then posts the file straight to
Cloudinary. So the API secret never reaches the browser, the file bytes never pass through this
server, and no one can upload to the account by reading the page source. The destination folder
(`Images/` or `Videos/`) is chosen server-side and is *part of the signed payload*, so a tampered
client cannot redirect uploads elsewhere — Cloudinary rejects any parameter that wasn't signed.
No upload preset is involved.

**Media limits — 5 photos and 2 videos per property.** Both numbers live in `shared/media.js` and
are enforced twice: the admin uploader stops early and says why, and the API trims anything over
the cap (extras are dropped, not rejected, so a CSV row with six photos imports five rather than
failing). Videos are delivered untransformed — any transform makes Cloudinary derive a rendition
on first request, and until that finishes the URL 423s, which a browser shows as a video that
won't play. The thumbnail is a still of the first frame, and videos only download when played.

**Admin (`/admin`)** — property CRUD, CSV import/export, lead pipeline with statuses, homepage copy
editing, health indicator.

**Leads** — every enquiry writes to the database, emails the agent (Resend), *and* opens a prefilled
WhatsApp message. Three independent channels, so no enquiry is lost to a single failure.

## Things worth knowing

**`ADMIN_TOKEN` is not authentication.** It's a shared-secret header on write endpoints, useful for
a demo. Replace it with a real login before the client manages live inventory. Leave it blank and
writes are open — fine locally, not on a public URL.

**Share previews are rendered server-side.** WhatsApp, Facebook and Instagram never run JavaScript,
so a normal React app shows a generic card for every listing. `backend/meta.js` injects each
property's real title, price, image and JSON-LD into the HTML before sending. This only works under
`npm start`. Serving `dist/` from a static host instead would silently revert every listing to the
generic card — which is the main reason this is deployed as one Node service rather than split.

**Area is normalised.** Listings mix sq.ft, ground, cent and acre. `areaSqft` is derived on save
(1 ground = 2,400 sq.ft) and is the only field used for sorting and filtering, so a 2-ground plot
correctly outranks a 1,000 sq.ft flat. The card still displays the unit as entered.

**Price ranges are scoped to buy vs rent.** Sale prices (₹50 L–₹6 Cr) and monthly rents
(₹15 K–₹1.5 L) share one `price` field, so a single global slider would be meaningless. The filter
requires a listing type before a price range applies; the API ignores the range otherwise and
reports `priceIgnored: true`.

**Sold and rented listings stay published.** They drop out of default browsing but remain reachable
at their URL, preserving the SEO value and acting as social proof. Hard delete is still available.

## Still to do

These are marked `TODO` in the code and don't block anything:

1. **`frontend/src/data/brand.js`** — email, head/branch office addresses and social URLs weren't in the
   supplied flyer. Everything the site renders is in this one file.
2. **Logo** — `frontend/public/assets/logo.svg` is a placeholder. Drop the real "Vel" mark at
   `frontend/public/assets/logo.png` and change the `logo:` line in `brand.js`.
3. **Property photographs** — `frontend/public/assets/properties/*.svg` are generated placeholders
   (`npm run assets` regenerates them). Set the three `CLOUDINARY_*` variables to let admins
   upload. The returned secure URLs are saved with the property and resized automatically when
   displayed. Local disk uploads are deliberately not supported — most Node hosts have ephemeral
   filesystems and would lose the photo library on every redeploy.
4. **`SITE_ORIGIN`** — set to the real domain so canonical URLs and share previews point correctly.
5. **Resend** — set `RESEND_API_KEY` and `LEAD_NOTIFY_EMAIL` to turn on lead emails. Without them
   enquiries still save and still open WhatsApp.

## Layout

```
backend/         Express — serves the API and, in production, the built site
  index.js       routes, in-memory fallback, production static + meta injection
  query.js       the single filter normaliser both storage paths use
  meta.js        share-preview tag rendering
  auth.js        admin sign-in, session tokens
  notify.js      lead email
  models/        Property, Lead, SiteContent
  data/          seed listings, homepage copy, reviews
frontend/        React SPA — built to dist/ and served by backend/
  index.html     Vite entry document
  public/        static assets, robots.txt, generated sitemap.xml
  src/
    data/brand.js  every brand string
    lib/           api client, formatting, browser storage, page meta,
                   compare state, scroll-reveal hook, Cloudinary upload
    components/    header, footer, cards, forms, sections, preloader, compare
    pages/         home, listings, detail, matchmaker, affordability, static
    AdminApp.jsx   admin dashboard
shared/          imported by BOTH backend and frontend — one source of truth
  units.js       area conversion
  money.js       ₹ formatting and price composition
  propertyImages.js  per-type fallback images
scripts/         placeholder asset + sitemap generators
dist/            build output (gitignored) — built on deploy and served by
                 backend/index.js; absent locally until `npm run build`
```

Three deliberate cross-boundary links, so keep them in mind when moving files:

- `shared/` is imported by both sides with plain relative paths (`../../shared/…` from
  `backend/`, `../../../shared/…` from `frontend/src/lib/`). No build step, no alias.
- `frontend/src/lib/api.js` lazy-imports `backend/data/properties.js` and `backend/query.js`
  so the SPA stays browsable when the API is unreachable. Vite splits these into their own
  chunks; they are not loaded on the happy path.
- `scripts/make-sitemap.js` reads the same backend seed data, which is why the sitemap
  can't drift from the listings that exist.

`vite.config.js` stays at the repo root with `root: "frontend"`. It also pins `envDir` to
the repo root — without that Vite would look for `.env` inside `frontend/`, find nothing,
and every `VITE_*` var would build as `undefined` rather than erroring.

## Verification

Checked on the production build in memory mode:

- API health, filtering, sorting, pagination, live type/city counts
- Filter parity between the Mongo and in-memory paths
- Area normalisation (acre/ground sort above sq.ft correctly)
- Price scoping (range ignored without a listing type)
- Lead validation, honeypot, rate limiting
- Property CRUD, slug collision suffixes, sold/rented lifecycle
- CSV bulk import with per-row error reporting
- `ADMIN_TOKEN` gate: 401 without, 201 with, reads stay public
- Per-listing share previews and JSON-LD
- All routes deep-link, SPA fallback, static assets
- Rendered in Chrome: no console errors, correct at 390 / 1440
- Matchmaker driven through all five steps, including the conditional bedrooms question
- Compare: the 3-item cap, best-value highlighting, and tie handling
- Affordability: reverse-EMI figures cross-checked by hand
- Preloader: scroll lock and release, session flag, skip
