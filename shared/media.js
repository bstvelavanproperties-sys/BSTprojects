// Per-listing media caps. Imported by BOTH the admin UI (to stop the upload early
// and explain why) and the API (which is the one that actually enforces it) — a
// browser-side limit alone is a suggestion, not a rule.
//
// Five photos and two videos is a deliberate ceiling, not a technical one: every
// extra item is another fetch on the detail page, and Cloudinary's free tier bills
// bandwidth. Raise these two numbers and the whole stack follows.
export const MAX_PROPERTY_IMAGES = 5;
export const MAX_PROPERTY_VIDEOS = 2;

// Cloudinary's unsigned preset caps file size on its side too; these exist so the
// admin gets an instant, specific error instead of waiting out a doomed upload.
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

export const formatBytes = (bytes) => {
  const mb = bytes / (1024 * 1024);
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
};

// Cloudinary folders uploads are filed into. Case-sensitive, and they must already
// exist in the Media Library — Cloudinary creates missing ones silently, which is
// how you end up with both "Images" and "images".
export const CLOUDINARY_FOLDERS = Object.freeze({
  image: "Images",
  video: "Videos",
});
