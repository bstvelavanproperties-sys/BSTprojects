// Signed Cloudinary uploads.
//
// The browser never sees the API secret. It asks this service for a short-lived
// signature, then posts the file straight to Cloudinary — so the file bytes never
// pass through here (Render's free tier would not enjoy that), while the account
// credentials never leave it.
//
// The signature covers the folder, so a tampered client cannot redirect uploads
// anywhere else in the media library: Cloudinary rejects any parameter that does
// not match what was signed.

import crypto from "node:crypto";

export const uploadsConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );

// Cloudinary's rule: take every parameter that will be sent EXCEPT file, api_key
// and resource_type, sort by key, join as "k=v&k=v", append the secret, SHA-1.
// Any drift here fails as a 401 "Invalid Signature" with no further detail.
export const signUpload = (params) => {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(payload + process.env.CLOUDINARY_API_SECRET)
    .digest("hex");
};

// Cloudinary treats a signature as valid for one hour. Nothing to configure —
// this is only here so the expiry is visible at the call site.
export const SIGNATURE_TTL_SECONDS = 3600;

export const buildUploadTicket = (folder) => {
  const timestamp = Math.round(Date.now() / 1000);
  // Signed params and sent params must match exactly, so they are built once.
  const signed = { folder, timestamp };

  return {
    ...signed,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    signature: signUpload(signed),
  };
};
