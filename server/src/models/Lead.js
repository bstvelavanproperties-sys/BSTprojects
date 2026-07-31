import mongoose from "mongoose";

export const LEAD_TYPES = [
  "enquiry",
  "site-visit",
  "callback",
  "property-wanted",
  "sell-request",
  "newsletter",
  "nri-enquiry",
];

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "scheduled",
  "visited",
  "converted",
  "closed",
];

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    message: { type: String, trim: true, default: "" },

    propertyId: { type: String, trim: true, default: "" },
    propertyTitle: { type: String, trim: true, default: "" },
    budget: { type: String, trim: true, default: "" },
    preferredTime: { type: String, trim: true, default: "" },

    // Where the enquirer is based. Free text, not an enum — the point is to know
    // which timezone to call into, and an NRI in a country we never listed is
    // exactly the lead we least want to drop.
    country: { type: String, trim: true, default: "" },

    type: { type: String, enum: LEAD_TYPES, default: "enquiry" },
    status: { type: String, enum: LEAD_STATUSES, default: "new" },

    // Attribution — captured client-side and passed through on submit.
    source: { type: String, trim: true, default: "Direct" },
    utmSource: { type: String, trim: true, default: "" },
    utmMedium: { type: String, trim: true, default: "" },
    utmCampaign: { type: String, trim: true, default: "" },
    landingPage: { type: String, trim: true, default: "/" },
  },
  { timestamps: true },
);

export default mongoose.model("Lead", leadSchema);
