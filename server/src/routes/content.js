import { Router } from "express";

import SiteContent from "../models/SiteContent.js";
import { defaultContent, reviews } from "../data/properties.js";
import { live, memory } from "../lib/memory.js";
import { cleanText } from "../lib/normalise.js";
import { requireAdmin } from "../middleware/auth.js";
import { requireDatabase } from "../middleware/database.js";
import { fail } from "../middleware/errors.js";

// Mounted at /api. Homepage copy and the review list — both are site content the
// homepage reads, which is why one router serves them.
const router = Router();

router.get("/content", requireDatabase, async (_request, response) => {
  if (!live()) return response.json(memory.content);
  const content = await SiteContent.findOne({ key: "homepage" }).lean();
  return response.json({ ...defaultContent, ...(content || {}) });
});

router.patch("/content", requireAdmin, requireDatabase, async (request, response) => {
  try {
    // Fall back to what is actually STORED, not to the seed defaults. The previous
    // version read `memory.content[key]`, which in live mode is never written to and
    // so always holds the defaults — meaning any field the admin form omitted was
    // silently reset to its seed value instead of being left alone. A PATCH must only
    // change the keys it was given.
    const current = live()
      ? (await SiteContent.findOne({ key: "homepage" }).lean()) || defaultContent
      : memory.content;

    const content = Object.fromEntries(
      Object.keys(defaultContent)
        .filter((key) => key !== "key")
        .filter((key) => request.body[key] !== undefined)
        .map((key) => [key, cleanText(request.body[key], 400)]),
    );

    if (live()) {
      const saved = await SiteContent.findOneAndUpdate(
        { key: "homepage" },
        { ...content, key: "homepage" },
        { new: true, upsert: true },
      );
      return response.json(saved);
    }
    memory.content = { ...current, ...content };
    return response.json(memory.content);
  } catch (error) {
    return fail(response, 500, "Could not save the content.", error);
  }
});

// Customer reviews. Served from a list rather than the database because there are
// no real ones yet — see the note in data/properties.js. The homepage section hides
// itself while this is empty, so shipping it empty is correct.
router.get("/reviews", (_request, response) => response.json(reviews));

export default router;
