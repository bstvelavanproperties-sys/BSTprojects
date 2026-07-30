# Deploying

Two services, one npm-workspaces repo:

```
/            root workspace — dev scripts only
├─ client/   the SPA, its Vercel function and its build scripts   → Vercel
├─ server/   the Express API                                      → Render
└─ shared/   @bstv/shared — code both of the above import
```

Each host builds one workspace, and both reach `shared/` through the
`file:../shared` dependency declared in their `package.json`.

| Piece    | Host          | Serves                                                  |
| -------- | ------------- | ------------------------------------------------------- |
| Frontend | Vercel Hobby  | the built SPA from `client/dist` + `client/api/share.js` |
| API      | Render        | `/api/*` — Express + Mongoose                            |
| Media    | Cloudinary    | listing images and videos                                |
| Database | MongoDB Atlas | listings, leads, homepage content                        |

The two config files are [`client/vercel.json`](client/vercel.json) and [`render.yaml`](render.yaml).

---

## The three settings that must agree

Almost every deployment problem with this split is one of these three disagreeing.
Write down your API origin once and use the same string in all three places:

1. **`VITE_API_BASE_URL`** (Vercel env) — where the browser sends `/api` requests.
2. **`connect-src`** in [`client/vercel.json`](client/vercel.json) — the browser blocks any API
   origin not listed here, no matter what step 1 says.
3. **`CLIENT_ORIGIN`** (Render env) — the API refuses browser requests from origins
   not listed here.

`client/vercel.json` currently allows `https://api.bstvelavanproperties.com` and
`https://bst-velavan.onrender.com`. If your API ends up anywhere else, edit it.

---

## 1. MongoDB Atlas

1. Create the cluster and a database user.
2. **Network Access → allowlist Render's static outbound IPs only.** Not
   `0.0.0.0/0`. Render's static IPs are on the service's Settings page (this is the
   main thing the paid Render plan buys you here).
3. Copy the connection string. Percent-encode the password if it contains
   `@ : / ? # [ ] %`.
4. Turn on backups. Atlas free tier (M0) has none — if the listings matter, this is
   the cheapest insurance you will ever buy.

## 2. Cloudinary

1. Create the `Images` and `Videos` folders (case-sensitive — see
   [`shared/media.js`](shared/media.js)).
2. **Settings → Upload → set a max file size.** The upload API has no
   `max_file_size` parameter, so this console setting is the only real ceiling. The
   10 MB / 100 MB limits in the browser are for fast, specific error messages; they
   are not enforcement. See the note in [`server/src/lib/uploads.js`](server/src/lib/uploads.js).
3. Copy the cloud name, API key and API secret. The secret is server-side only and
   never reaches the browser.

## 3. Render (API)

Deploy from `render.yaml`, then set the secret env vars in the dashboard.

`render.yaml` sets `rootDir: server`, so Render installs and starts inside the server
workspace only — it never installs Vite or Tailwind. The `@bstv/shared` dependency
resolves as a `file:../shared` link out of the cloned repo, so nothing needs publishing.

Local equivalents of these variables live in the single repo-root `.env` (see
[`.env.example`](.env.example)); on Render they are dashboard values.

**The API will refuse to start** if any required variable is missing, weak, or
half-configured, and prints the full list of problems to the deploy log. This is
deliberate: the previous behaviour was to boot anyway with the admin API wide open.

Required:

```
MONGODB_URI       # Atlas connection string
ADMIN_USERNAME    # not "admin" — it is guessed first
ADMIN_PASSWORD    # 12+ chars, not a known password
SESSION_SECRET    # HS256 key for the admin JWTs; Render generates it, leave it alone
SITE_ORIGIN       # https://bstvelavanproperties.com  (the SITE, not this API)
CLIENT_ORIGIN     # https://bstvelavanproperties.com,https://www.bstvelavanproperties.com
```

Generate a session secret by hand if you ever need to:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

There is no enquiry-notification channel: leads are written to MongoDB and read from
the `/admin` lead inbox. Nobody is emailed or messaged when one arrives, so someone
has to check the inbox — see "Things that will bite you" below.

Then attach a custom domain — `api.bstvelavanproperties.com` is the tidy choice, and
being a subdomain of the site it keeps the door open to cookie-based sessions later.

## 4. Vercel (frontend)

Import the repo, then set **two things in the project settings** before the first
deploy — `vercel.json` cannot set either of them:

1. **Root Directory → `client`.** This is what makes `client/vercel.json`,
   `client/api/share.js` and `client/dist` line up with the paths Vercel expects.
2. **Include source files outside of the Root Directory in the Build Step → on.**
   Both the bundle and `client/api/share.js` import `@bstv/shared`, which lives at
   `shared/` — one level above the root directory. Without this the build fails with
   an unresolved `@bstv/shared/...` import.

`client/vercel.json` then sets the build command, output directory and headers.

Env vars (locally these live in the same repo-root `.env` as the API's — see
[`.env.example`](.env.example)):

```
VITE_API_BASE_URL=https://api.bstvelavanproperties.com   # no trailing slash
SITE_ORIGIN=https://bstvelavanproperties.com
VITE_GA_MEASUREMENT_ID=G-XXXXXXX                          # optional
```

`VITE_*` variables are read at **build time**, so changing one needs a redeploy, not
just a restart.

Attach the apex domain and `www`. Then set `SITE_ORIGIN` on **both** hosts to the
canonical one you picked.

## 5. Verify

```bash
# API is alive and actually talking to Mongo — expect {"ok":true,"database":"connected"}
curl https://api.bstvelavanproperties.com/api/health

# Security headers are present
curl -sI https://bstvelavanproperties.com | grep -iE "content-security|strict-transport"

# Admin is locked. Expect 401, NOT a listing.
curl -X POST https://api.bstvelavanproperties.com/api/properties \
  -H 'content-type: application/json' -d '{"title":"probe","city":"probe"}'

# CORS rejects an unknown origin (no access-control-allow-origin in the response)
curl -sI -H "Origin: https://evil.example" \
  https://api.bstvelavanproperties.com/api/properties | grep -i access-control

# Share preview is rendered server-side — expect the listing title, not the generic one
curl -s https://bstvelavanproperties.com/real-estate/SOME-REAL-SLUG | grep "og:title"
```

Finally, sign in at `/admin`, add one real listing, and confirm it appears on `/buy`.

---

## Things that will bite you

- **`VITE_API_BASE_URL` with a trailing slash** produces `//api/...`. Omit it.
- **Changing the API origin** means editing `connect-src` in `client/vercel.json` too. The
  symptom is a working `curl` and a browser console full of CSP violations.
- **`SITE_ORIGIN` still on localhost** silently breaks every canonical URL and share
  preview. Nothing errors; the tags are just wrong.
- **`npm run seed`** loads 24 *invented* demo listings. It refuses to run against
  `NODE_ENV=production`, but do not point it at your live database anyway.
- **Nothing tells you a lead arrived.** Enquiries are saved to MongoDB and shown in
  the `/admin` lead inbox, and that is the whole delivery mechanism — no email, no
  SMS, no webhook. On a lead-generation site an unchecked inbox is a lost sale, so
  make checking it someone's actual job, or add a notification channel back.
- **Rate limits are per instance and in memory.** They reset on every deploy and do
  not add up across instances. Fine for one warm Render instance; if you ever scale
  past one, they need moving to a shared store.
- **Vercel preview deploys** get their own origin, so API calls from a preview fail
  CORS until you add that origin to `CLIENT_ORIGIN`.
- **The sitemap is built by asking the API**, not the database — `client/scripts/
  make-sitemap.js` reads `VITE_API_BASE_URL`. If the API is down or that variable is
  wrong at deploy time, you get a valid sitemap containing the 9 static routes and no
  listings, with a warning in the build log and no failed deploy. Re-deploy once the
  API is healthy to pick the listings back up.
- **The Vercel "files outside the Root Directory" toggle** (step 4.2) is easy to lose
  when a project is re-created. The symptom is a build that fails on an unresolved
  `@bstv/shared/...` import.

## Still open

Known gaps, none of them blocking:

- **No tests.** The filter logic in [`server/src/lib/query.js`](server/src/lib/query.js) is
  duplicated for Mongo and in-memory paths and nothing checks that the two agree.
- **No React error boundary** — one render error blanks the page instead of
  degrading.
- **Session token lives in `localStorage`**, so any XSS could read it. The CSP is the
  mitigation. Moving to an httpOnly cookie is straightforward once the API is on a
  subdomain of the site.
- **No error tracking or uptime monitoring.**
- **`react-router-dom` 7.18.1** carries two HIGH advisories that do not apply to this
  app (they need RSC mode). Worth pinning to a fixed release when one ships.
- **Brand placeholders** — office addresses, logo and social links in
  [`client/src/config/brand.js`](client/src/config/brand.js) are still `TODO`.
- **No real reviews.** The homepage testimonials section stays hidden until
  [`server/src/data/properties.js`](server/src/data/properties.js) has genuine ones.
