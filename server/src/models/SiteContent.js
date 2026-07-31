import mongoose from "mongoose";

const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "homepage" },
    announcement: { type: String, trim: true, default: "" },
    heroHeadline: { type: String, trim: true, default: "" },
    heroSubline: { type: String, trim: true, default: "" },
    heroImage: { type: String, trim: true, default: "" },
    featuredTitle: { type: String, trim: true, default: "" },
    featuredSubtitle: { type: String, trim: true, default: "" },
    rentalTitle: { type: String, trim: true, default: "" },

    // The homepage NRI prompt. There is deliberately no separate "enabled" boolean:
    // PATCH /content runs cleanText() over every value, so a stored false would come
    // back as the string "false" and read as truthy. An empty title hides it instead,
    // which also gives the admin an off switch that needs no extra control.
    nriPopupTitle: { type: String, trim: true, default: "" },
    nriPopupBody: { type: String, trim: true, default: "" },
    nriPopupCta: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    whatsapp: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("SiteContent", siteContentSchema);
