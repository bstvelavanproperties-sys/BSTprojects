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
    phone: { type: String, trim: true, default: "" },
    whatsapp: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("SiteContent", siteContentSchema);
