import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, formatBytes } from "@bstv/shared/media.js";
import { createUploadTicket } from "./api.js";

// Uploads are signed by our own API, so nothing Cloudinary-related is baked into
// this bundle — no cloud name, no key, no preset. The browser asks for a ticket
// (which requires an admin session), then posts the file straight to Cloudinary,
// so the bytes never travel through our server.
//
// The destination folder is chosen and signed server-side. Changing it here would
// only produce an "Invalid Signature" error, which is the point.
const KINDS = {
  image: { label: "image", maxBytes: MAX_IMAGE_BYTES },
  video: { label: "video", maxBytes: MAX_VIDEO_BYTES },
};

const upload = async (file, kind) => {
  const { label, maxBytes } = KINDS[kind];

  if (!file?.type?.startsWith(`${kind}/`)) {
    throw new Error(`${file?.name || "That file"} is not a ${label}.`);
  }

  // Checked before anything is sent, so an oversized phone video fails instantly
  // rather than after a long upload that Cloudinary rejects at the end.
  //
  // Convenience, not a control: this runs in the browser and is trivially skipped.
  // See the size note in server/src/lib/uploads.js — the real ceiling is an account
  // setting in the Cloudinary console.
  if (file.size > maxBytes) {
    throw new Error(
      `${file.name} is ${formatBytes(file.size)} — the limit is ${formatBytes(maxBytes)} per ${label}.`,
    );
  }

  const ticket = await createUploadTicket(kind);

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", ticket.apiKey);
  body.append("timestamp", ticket.timestamp);
  body.append("signature", ticket.signature);
  // Both must match the signed values byte for byte, or Cloudinary returns 401.
  // allowed_formats is the server's real type gate; the check above only reads the
  // MIME type the browser volunteered.
  body.append("folder", ticket.folder);
  body.append("allowed_formats", ticket.allowed_formats);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(ticket.cloudName)}/${ticket.resourceType}/upload`,
    { method: "POST", body },
  );
  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || `Cloudinary upload failed for ${file.name}.`);
  }

  return result.secure_url;
};

export const uploadImageToCloudinary = (file) => upload(file, "image");
export const uploadVideoToCloudinary = (file) => upload(file, "video");
