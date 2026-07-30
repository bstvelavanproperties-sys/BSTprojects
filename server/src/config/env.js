// Boot-time environment validation.
//
// The rule this file exists to enforce: in production the server must refuse to
// start rather than start in a state that is quietly insecure or quietly fake.
// Previously a missing ADMIN_PASSWORD left every write endpoint open behind
// nothing but a console warning, and a missing MONGODB_URI served 24 seed
// listings as if they were real inventory. Both now stop the process.
//
// Local development keeps every convenience: no database, no credentials, no
// Cloudinary — the site still runs, because nothing there is exposed.

import "./loadEnv.js";
import crypto from "node:crypto";

const isProduction = process.env.NODE_ENV === "production";

const errors = [];
const warnings = [];

const required = (key, hint) => {
  const value = (process.env[key] || "").trim();
  if (!value) errors.push(`${key} is not set — ${hint}`);
  return value;
};

// ---------------------------------------------------------------------------
// Admin credentials
// ---------------------------------------------------------------------------
const adminUsername = (process.env.ADMIN_USERNAME || "").trim();
const adminPassword = process.env.ADMIN_PASSWORD || "";
const adminToken = (process.env.ADMIN_TOKEN || "").trim();

export const credentialsConfigured = Boolean(adminUsername && adminPassword);
export const tokenConfigured = Boolean(adminToken);

// The single most important invariant in the codebase. requireAdmin() used to let
// every request through when neither was configured; production now cannot boot
// into that state at all.
if (isProduction && !credentialsConfigured && !tokenConfigured) {
  errors.push(
    "Neither ADMIN_USERNAME + ADMIN_PASSWORD nor ADMIN_TOKEN is set — " +
      "the admin API would accept anonymous writes. Set credentials in the Render dashboard.",
  );
}

// Credentials that appear in every default-credential wordlist. Refusing these is
// not paranoia: /admin is linked from robots.txt and gets scanned within hours of
// a domain going live.
const WEAK = new Set([
  "admin",
  "administrator",
  "root",
  "user",
  "test",
  "demo",
  "password",
  "password1",
  "password123",
  "admin123",
  "changeme",
  "letmein",
  "secret",
  "12345678",
  "123456789",
  "qwerty123",
]);

if (isProduction && credentialsConfigured) {
  if (WEAK.has(adminPassword.toLowerCase())) {
    errors.push("ADMIN_PASSWORD is a default/known password. Choose something unguessable.");
  }
  if (adminPassword.length < 12) {
    errors.push(`ADMIN_PASSWORD is ${adminPassword.length} characters — use at least 12.`);
  }
  if (WEAK.has(adminUsername.toLowerCase())) {
    warnings.push(`ADMIN_USERNAME "${adminUsername}" is guessable; a non-obvious name is free to set.`);
  }
}

// ---------------------------------------------------------------------------
// Session signing key
// ---------------------------------------------------------------------------
// auth.js falls back to deriving the HMAC key from "username:password" when this
// is unset. That fallback is fine for a throwaway local session and unacceptable
// in production: a single leaked token becomes an offline brute-force target that
// recovers the admin password itself.
export const sessionSecret = isProduction
  ? required(
      "SESSION_SECRET",
      "without it session tokens are signed with a key derived from your admin password, " +
        "so a leaked token can be cracked offline to recover it. " +
        `Generate one with: node -e "console.log(crypto.randomBytes(32).toString('hex'))"`,
    )
  : process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");

if (isProduction && sessionSecret && sessionSecret.length < 32) {
  errors.push(`SESSION_SECRET is ${sessionSecret.length} characters — use at least 32.`);
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------
export const mongoUri = isProduction
  ? required(
      "MONGODB_URI",
      "production must not fall back to in-memory seed data, which would serve demo listings as real inventory",
    )
  : (process.env.MONGODB_URI || "").trim();

if (mongoUri.includes("<db_password>")) {
  errors.push("MONGODB_URI still contains the literal <db_password> placeholder.");
}

// ---------------------------------------------------------------------------
// Origins
// ---------------------------------------------------------------------------
const stripSlash = (value) => value.trim().replace(/\/+$/, "");

// Public address of the SITE (Vercel / your domain) — drives canonical URLs,
// share-preview tags and sitemap entries. A wrong value breaks link previews
// silently, which is why production insists on it being set explicitly.
export const siteOrigin = isProduction
  ? stripSlash(required("SITE_ORIGIN", "canonical URLs and share previews would point at localhost"))
  : stripSlash(process.env.SITE_ORIGIN || `http://localhost:${process.env.PORT || 5000}`);

// Browser origins allowed to call this API. With the frontend on Vercel and the
// API on Render these are genuinely different origins, so this is now the real
// access-control boundary rather than a dev-only convenience.
export const clientOrigins = (process.env.CLIENT_ORIGIN || (isProduction ? "" : "http://localhost:5173"))
  .split(",")
  .map(stripSlash)
  .filter(Boolean);

if (isProduction) {
  if (!clientOrigins.length) {
    errors.push(
      "CLIENT_ORIGIN is not set — the frontend is deployed to a different origin than this API, " +
        "so its browser requests would all fail CORS. Set it to your site origin(s), comma-separated.",
    );
  }
  for (const origin of clientOrigins) {
    if (origin === "*") errors.push("CLIENT_ORIGIN must not be '*'.");
    if (origin.startsWith("http://")) {
      warnings.push(`CLIENT_ORIGIN "${origin}" is plain http — browsers will block it from an https site.`);
    }
  }
}

// ---------------------------------------------------------------------------
// Optional integrations — absent is fine, half-configured is not
// ---------------------------------------------------------------------------
export const cloudinary = {
  cloudName: (process.env.CLOUDINARY_CLOUD_NAME || "").trim(),
  apiKey: (process.env.CLOUDINARY_API_KEY || "").trim(),
  apiSecret: (process.env.CLOUDINARY_API_SECRET || "").trim(),
};
cloudinary.configured = Boolean(cloudinary.cloudName && cloudinary.apiKey && cloudinary.apiSecret);

const cloudinarySet = Object.entries(cloudinary).filter(([key, value]) => key !== "configured" && value).length;
if (cloudinarySet > 0 && !cloudinary.configured) {
  errors.push("Cloudinary is half-configured — set all three of CLOUDINARY_CLOUD_NAME, _API_KEY, _API_SECRET, or none.");
}
if (isProduction && !cloudinary.configured) {
  warnings.push("Cloudinary is not configured — image and video uploads will be unavailable in /admin.");
}

// ---------------------------------------------------------------------------
export const port = Number(process.env.PORT) || 5000;
export const production = isProduction;

// Fail loudly and all at once, so one restart surfaces every problem instead of
// making you rediscover them one deploy at a time.
export const validateEnvironment = () => {
  for (const warning of warnings) console.warn(`WARNING: ${warning}`);

  if (errors.length) {
    console.error(
      `\nRefusing to start — ${errors.length} configuration ${errors.length === 1 ? "problem" : "problems"}:\n`,
    );
    for (const error of errors) console.error(`  • ${error}`);
    console.error("");
    process.exit(1);
  }
};
