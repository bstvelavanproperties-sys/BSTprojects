import { Router } from "express";

import Lead, { LEAD_STATUSES, LEAD_TYPES } from "../models/Lead.js";
import { live, memory } from "../lib/memory.js";
import { cleanText } from "../lib/normalise.js";
import { isRateLimited } from "../lib/rateLimit.js";
import { requireAdmin } from "../middleware/auth.js";
import { requireDatabase } from "../middleware/database.js";
import { fail } from "../middleware/errors.js";

const router = Router();

router.post("/", requireDatabase, async (request, response) => {
  // Honeypot: a field no human fills in.
  if (cleanText(request.body?.company)) {
    return response.status(201).json({ message: "Thanks — we'll be in touch." });
  }

  const ip = request.ip || "unknown";
  if (isRateLimited(ip)) {
    return response.status(429).json({ error: "Too many enquiries. Please call us instead." });
  }

  const lead = {
    name: cleanText(request.body.name, 100),
    phone: cleanText(request.body.phone, 24),
    email: cleanText(request.body.email, 160).toLowerCase(),
    message: cleanText(request.body.message, 1200),
    propertyId: cleanText(request.body.propertyId, 140),
    propertyTitle: cleanText(request.body.propertyTitle, 200),
    budget: cleanText(request.body.budget, 60),
    preferredTime: cleanText(request.body.preferredTime, 40),
    country: cleanText(request.body.country, 60),
    type: LEAD_TYPES.includes(request.body.type) ? request.body.type : "enquiry",
    status: "new",
    source: cleanText(request.body.source, 80) || "Direct",
    utmSource: cleanText(request.body.utmSource, 100),
    utmMedium: cleanText(request.body.utmMedium, 100),
    utmCampaign: cleanText(request.body.utmCampaign, 150),
    landingPage: cleanText(request.body.landingPage, 250) || "/",
  };

  const isNewsletter = lead.type === "newsletter";
  if (isNewsletter ? !lead.email : !lead.name || !lead.phone) {
    return response
      .status(400)
      .json({ error: isNewsletter ? "An email address is required." : "Name and phone are required." });
  }

  try {
    const created = live()
      ? (await Lead.create(lead)).toObject()
      : { _id: `lead-${Date.now()}`, ...lead, createdAt: new Date().toISOString() };

    if (!live()) memory.leads.unshift(created);

    // Enquiries are stored only — there is no notification channel. They surface in
    // the /admin lead inbox, which is therefore the one place they are seen.
    return response.status(201).json({ message: "Thanks — we'll be in touch.", lead: created });
  } catch (error) {
    return fail(response, 500, "Could not save the enquiry.", error);
  }
});

router.get("/", requireAdmin, requireDatabase, async (_request, response) => {
  try {
    const leads = live() ? await Lead.find().sort({ createdAt: -1 }).limit(500).lean() : memory.leads;
    return response.json(leads);
  } catch (error) {
    return fail(response, 500, "Could not load leads.", error);
  }
});

router.patch("/:id", requireAdmin, requireDatabase, async (request, response) => {
  if (!LEAD_STATUSES.includes(request.body.status)) {
    return response.status(400).json({ error: "Invalid status." });
  }

  try {
    if (live()) {
      const lead = await Lead.findByIdAndUpdate(request.params.id, { status: request.body.status }, { new: true });
      if (!lead) return response.status(404).json({ error: "Lead not found." });
      return response.json(lead);
    }
    const lead = memory.leads.find((item) => String(item._id) === request.params.id);
    if (!lead) return response.status(404).json({ error: "Lead not found." });
    lead.status = request.body.status;
    return response.json(lead);
  } catch (error) {
    return fail(response, 500, "Could not update the lead.", error);
  }
});

export default router;
