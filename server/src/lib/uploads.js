// Signed Cloudinary uploads.
//
// The browser never sees the API secret. It asks this service for a short-lived
// signature, then posts the file straight to Cloudinary — so the file bytes never
// pass through here, while the account credentials never leave it.
//
// Everything in `signed` below is enforced by Cloudinary: it recomputes the
// signature over the parameters it actually received, so a tampered client gets a
// 401 rather than an upload on its own terms.

import crypto from "node:crypto";

import { CLOUDINARY_FOLDERS } from "@bstv/shared/media.js";
import { cloudinary } from "../config/env.js";

export const uploadsConfigured = () => cloudinary.configured;

// Format allowlist. This is the real type gate: the browser-side check in
// client/src/lib/cloudinary.js only inspects the File object's own MIME type,
// which the client fully controls. `allowed_formats` is part of the signature, so
// Cloudinary rejects anything outside this list no matter what the client claims.
//
// Cloudinary sniffs the actual file, so renaming payload.svg to photo.jpg does not
// get past it either. SVG is deliberately absent — it can carry script, and it
// would be served from our own delivery domain.
const ALLOWED_FORMATS = {
  image: ["jpg", "jpeg", "png", "webp", "avif", "heic", "heif"],
  video: ["mp4", "mov", "webm", "m4v"],
};

// Cloudinary's rule: take every parameter that will be sent EXCEPT file, api_key
// and resource_type, sort by key, join as "k=v&k=v", append the secret, SHA-1.
// Any drift here fails as a 401 "Invalid Signature" with no further detail.
export const signUpload = (params) => {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto.createHash("sha1").update(payload + cloudinary.apiSecret).digest("hex");
};

// Cloudinary treats a signature as valid for one hour and offers no parameter to
// shorten that, so the window is fixed. It is only reachable behind an admin
// session, which is what actually bounds the exposure.
export const SIGNATURE_TTL_SECONDS = 3600;

// NOTE ON FILE SIZE: the upload API has no max_file_size parameter — size ceilings
// are an account/preset setting, not something that can be signed per request. The
// MAX_IMAGE_BYTES / MAX_VIDEO_BYTES checks in the browser are therefore UX only
// (instant, specific errors), NOT enforcement. Cap it for real in the Cloudinary
// console under Settings → Upload → "Max file size", or an authenticated admin can
// upload files far larger than the UI suggests and burn your bandwidth quota.
export const buildUploadTicket = (kind) => {
  const timestamp = Math.round(Date.now() / 1000);

  // Signed params and sent params must match exactly, so they are built once and
  // spread into the response rather than re-derived on either side.
  const signed = {
    folder: CLOUDINARY_FOLDERS[kind],
    timestamp,
    allowed_formats: ALLOWED_FORMATS[kind].join(","),
  };

  return {
    ...signed,
    cloudName: cloudinary.cloudName,
    apiKey: cloudinary.apiKey,
    signature: signUpload(signed),
    resourceType: kind,
  };
};
