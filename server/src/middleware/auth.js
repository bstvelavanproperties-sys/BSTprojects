// Admin sign-in. A single shared account whose credentials live in the environment —
// there is no user table, because there is exactly one operator (the agency).
//
// On success the server issues an HS256 JWT. The token is self-contained, so a
// restarted or scaled-out API still accepts it without shared session storage.
//
// NOTE: the token is held in localStorage by the browser, so any XSS could read it —
// the CSP is the mitigation. Switching to an httpOnly cookie is the real fix and is
// tracked in DEPLOY.md; it becomes straightforward once the API is a subdomain of
// the site. Moving to JWT did not change that either way.

import crypto from "node:crypto";

import jwt from "jsonwebtoken";

import {
  credentialsConfigured as configured,
  production as isProduction,
  sessionSecret,
  tokenConfigured,
} from "../config/env.js";

const SESSION_TTL_SECONDS = 12 * 60 * 60; // 12 hours

// HS256 and nothing else, on both sign and verify.
//
// This is the one thing a hand-rolled HMAC token could not get wrong and a JWT can:
// the token carries its own `alg` header, so a verifier that trusts it will happily
// accept `alg: none` (no signature at all) or a token re-signed under a weaker
// algorithm. Pinning the list here means the header is checked against us rather
// than the other way round.
const JWT_ALGORITHM = "HS256";

// Hashing both sides first keeps the comparison constant-length, so neither the
// length nor the content of a wrong guess is observable through timing.
const digest = (value) => crypto.createHash("sha256").update(String(value ?? "")).digest();

// Exported: the old server.js carried a byte-identical private copy of this called
// timingSafeMatch, used for the ADMIN_TOKEN comparison. One implementation now.
export const safeEqual = (a, b) => crypto.timingSafeEqual(digest(a), digest(b));

export const credentialsConfigured = () => configured;

export const verifyCredentials = (username, password) =>
  configured &&
  safeEqual(username, process.env.ADMIN_USERNAME) &&
  safeEqual(password, process.env.ADMIN_PASSWORD);

// A standard HS256 JWT, signed with SESSION_SECRET — which config/env.js refuses to
// boot production without. Deriving the key from the admin password (the old
// fallback) made any leaked token an offline brute-force target for the password.
//
// There is no user table, so the whole claim set is "which operator, until when":
// `sub` is the admin username and `exp` is set by expiresIn.
//
// `expires` is returned alongside in MILLISECONDS, matching what this endpoint has
// always returned — the JWT's own `exp` claim is in seconds, and quietly changing
// the unit would break any client doing date maths on it.
export const issueSession = () => {
  const token = jwt.sign({ sub: process.env.ADMIN_USERNAME }, sessionSecret, {
    algorithm: JWT_ALGORITHM,
    expiresIn: SESSION_TTL_SECONDS,
  });

  return { token, expires: jwt.decode(token).exp * 1000 };
};

// Signature, expiry and algorithm are all checked by verify(); anything it rejects
// throws, so a bad token can only ever leave here as false.
export const verifySession = (token) => {
  if (typeof token !== "string" || !token) return false;

  try {
    jwt.verify(token, sessionSecret, { algorithms: [JWT_ALGORITHM] });
    return true;
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------------------
// Brute-force brake, per IP. Deliberately stricter than the lead-form limiter.
// ---------------------------------------------------------------------------
// Bounded on purpose. The previous Map only ever grew: every distinct source IP
// added an entry that was never removed, so a spray across many addresses was a
// slow memory leak with no ceiling. Entries are now swept on write and the map is
// capped, which trades perfect accounting under a flood for a fixed memory cost.
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const MAX_TRACKED_IPS = 10_000;

const recentFor = (ip) => {
  const now = Date.now();
  return (attempts.get(ip) || []).filter((time) => now - time < WINDOW_MS);
};

// Drops every IP whose window has fully expired. Called only when the map is at
// its cap, so the cost is paid rarely rather than on every request.
const sweep = () => {
  const now = Date.now();
  for (const [ip, times] of attempts) {
    if (times.every((time) => now - time >= WINDOW_MS)) attempts.delete(ip);
  }

  // Still full after sweeping means a genuine flood of live attackers. Evicting
  // the oldest insertions keeps memory flat; the cost is that the evicted IPs get
  // their attempt budget back, which is strictly better than falling over.
  if (attempts.size >= MAX_TRACKED_IPS) {
    const excess = attempts.size - MAX_TRACKED_IPS + 1;
    for (const ip of [...attempts.keys()].slice(0, excess)) attempts.delete(ip);
  }
};

export const loginBlocked = (ip) => {
  const recent = recentFor(ip);
  if (recent.length) attempts.set(ip, recent);
  else attempts.delete(ip);
  return recent.length >= MAX_ATTEMPTS;
};

export const recordFailedLogin = (ip) => {
  if (!attempts.has(ip) && attempts.size >= MAX_TRACKED_IPS) sweep();

  const recent = recentFor(ip);
  // Capped so one IP cannot grow an unbounded timestamp array of its own.
  recent.push(Date.now());
  attempts.set(ip, recent.slice(-MAX_ATTEMPTS));
};

export const clearLoginAttempts = (ip) => attempts.delete(ip);

// ---------------------------------------------------------------------------
// Route guard
// ---------------------------------------------------------------------------
// Accepts either a session from username/password sign-in, or the legacy static
// ADMIN_TOKEN (kept so scripted imports keep working).
//
// The open-when-unconfigured branch this used to have was the worst hole in the
// codebase: a cleared or mistyped ADMIN_PASSWORD in the Render dashboard silently
// handed anonymous callers the ability to edit listings and read every lead's name
// and phone number, guarded by nothing but a startup warning. It is now dev-only,
// and config/env.js refuses to boot production without credentials, so the two
// conditions cannot both be true in a deployed environment.
//
// isAuthenticated is separated out because GET /api/admin/session has to report
// exactly what requireAdmin would decide — when those two drifted apart, the admin
// panel rendered for anonymous visitors.
export const isAuthenticated = (request) => {
  const supplied = request.get("x-admin-token") || "";

  if (configured && verifySession(supplied)) return true;
  if (tokenConfigured && safeEqual(supplied, process.env.ADMIN_TOKEN)) return true;
  return !isProduction && !configured && !tokenConfigured;
};

export const requireAdmin = (request, response, next) => {
  if (isAuthenticated(request)) return next();
  return response.status(401).json({ error: "Sign in required." });
};
