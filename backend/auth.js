// Admin sign-in. A single shared account whose credentials live in the environment —
// there is no user table, because there is exactly one operator (the agency).
//
// On success the server issues an HMAC-signed, expiring session token. The token is
// self-contained, so a restarted or scaled-out API still accepts it without shared
// session storage.

import crypto from "node:crypto";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// Hashing both sides first keeps the comparison constant-length, so neither the
// length nor the content of a wrong guess is observable through timing.
const digest = (value) => crypto.createHash("sha256").update(String(value ?? "")).digest();

const safeEqual = (a, b) => crypto.timingSafeEqual(digest(a), digest(b));

// Falls back to deriving the key from the password, so changing the password
// invalidates every session that was issued under the old one.
const secret = () =>
  process.env.SESSION_SECRET ||
  `${process.env.ADMIN_USERNAME || ""}:${process.env.ADMIN_PASSWORD || ""}`;

const sign = (payload) => crypto.createHmac("sha256", secret()).update(payload).digest("base64url");

export const credentialsConfigured = () =>
  Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);

export const verifyCredentials = (username, password) =>
  credentialsConfigured() &&
  safeEqual(username, process.env.ADMIN_USERNAME) &&
  safeEqual(password, process.env.ADMIN_PASSWORD);

export const issueSession = () => {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${process.env.ADMIN_USERNAME}|${expires}`;
  const encoded = Buffer.from(payload).toString("base64url");
  return { token: `${encoded}.${sign(payload)}`, expires };
};

export const verifySession = (token) => {
  if (typeof token !== "string" || !token.includes(".")) return false;

  // base64url never contains ".", so the last one always separates the signature.
  const cut = token.lastIndexOf(".");
  const encoded = token.slice(0, cut);
  const signature = token.slice(cut + 1);

  let payload;
  try {
    payload = Buffer.from(encoded, "base64url").toString();
  } catch {
    return false;
  }

  if (!safeEqual(signature, sign(payload))) return false;

  // A username may itself contain "|", so the expiry is whatever follows the last one.
  const expires = Number(payload.slice(payload.lastIndexOf("|") + 1));
  return Number.isFinite(expires) && expires > Date.now();
};

// Brute-force brake, per IP. Deliberately stricter than the lead-form limiter.
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export const loginBlocked = (ip) => {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((time) => now - time < WINDOW_MS);
  attempts.set(ip, recent);
  return recent.length >= MAX_ATTEMPTS;
};

export const recordFailedLogin = (ip) => {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
};

export const clearLoginAttempts = (ip) => attempts.delete(ip);
