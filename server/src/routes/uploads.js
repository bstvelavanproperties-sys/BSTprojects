import { Router } from "express";

import { buildUploadTicket, uploadsConfigured } from "../lib/uploads.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// Lets the admin UI show the uploader or an explanatory notice, without leaking
// whether Cloudinary is configured to anonymous callers.
router.get("/config", requireAdmin, (_request, response) =>
  response.json({ configured: uploadsConfigured() }),
);

// Admin-gated on purpose: this is the whole reason to sign uploads rather than use
// an unsigned preset. No session, no signature, no upload.
router.post("/signature", requireAdmin, (request, response) => {
  if (!uploadsConfigured()) {
    return response.status(503).json({
      error:
        "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
    });
  }

  // The kind is narrowed to one of two known values here, never trusted as given.
  // Everything it determines — destination folder and format allowlist — is chosen
  // server-side and signed, so a tampered client cannot redirect the upload
  // elsewhere in the library or smuggle in a format we do not accept.
  const kind = request.body?.kind === "video" ? "video" : "image";

  return response.json(buildUploadTicket(kind));
});

export default router;
