import mongoose from "mongoose";
import { toSqft } from "@bstv/shared/units.js";
import { LISTING_TYPES, PROPERTY_TYPES, LABELS, STATUSES } from "../lib/query.js";

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    description: { type: String, trim: true, default: "" },

    listingType: { type: String, enum: LISTING_TYPES, default: "sale", index: true },
    propertyType: { type: String, enum: PROPERTY_TYPES, default: "plot", index: true },
    labels: [{ type: String, enum: LABELS }],
    status: { type: String, enum: STATUSES, default: "available", index: true },

    // When status last became sold/rented. Server-derived only — the routes set it on
    // the transition and never accept it from a request body, so a sale cannot be
    // backdated by a caller.
    //
    // This exists instead of reading `updatedAt` because that moves on every edit: fix
    // a typo on a sold listing and it would rewind to "selling process". Null means
    // either still available, or closed before this field existed — shared/saleStage.js
    // reads the latter as long-since-closed.
    closedAt: { type: Date, default: null },

    // Price display is not a single number on the reference site — see priceSuffix etc.
    // `price` stays numeric so sorting and range filters remain meaningful.
    // Optional: 0 means "not disclosed" and renders as Price on Request.
    price: { type: Number, default: 0, index: true },
    // Price is known but withheld publicly — the listing invites a call instead.
    hidePrice: { type: Boolean, default: false },
    pricePrefix: { type: String, trim: true, default: "" }, // e.g. "Per Flat"
    priceSuffix: { type: String, trim: true, default: "" }, // e.g. "Per Acre", "Per Month"
    priceNote: { type: String, trim: true, default: "" }, // e.g. "Total Price 2.40 Cr"

    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    areaValue: { type: Number, default: 0 },
    areaUnit: { type: String, enum: Object.keys({ sqft: 1, ground: 1, cent: 1, acre: 1 }), default: "sqft" },
    areaSqft: { type: Number, default: 0, index: true }, // derived — the only area field used to sort/filter
    facing: { type: String, trim: true, default: "" },
    furnishing: { type: String, trim: true, default: "" },

    locationText: { type: String, trim: true, default: "" }, // free-form, rendered verbatim
    locality: { type: String, trim: true, default: "" },
    city: { type: String, required: true, trim: true, index: true },
    state: { type: String, trim: true, default: "Tamil Nadu" },
    pincode: { type: String, trim: true, default: "" },
    latitude: { type: Number },
    longitude: { type: Number },

    // Cloudinary secure URLs. Capped in normaliseProperty(), not here — a schema
    // validator would reject the whole write, and silently trimming the extras is
    // the kinder behaviour for a CSV import of mixed-quality rows.
    images: [{ type: String, trim: true }],
    videos: [{ type: String, trim: true }],
    amenities: [{ type: String, trim: true }],
    featured: { type: Boolean, default: false, index: true },
    verified: { type: Boolean, default: true },
  },
  { timestamps: true },
);

propertySchema.index({ title: "text", locationText: "text", locality: "text" });
propertySchema.index({ city: 1, listingType: 1, propertyType: 1 });

propertySchema.pre("save", function deriveAreaSqft(next) {
  this.areaSqft = toSqft(this.areaValue, this.areaUnit);
  next();
});

propertySchema.pre("findOneAndUpdate", function deriveAreaSqftOnUpdate(next) {
  const update = this.getUpdate() || {};
  const target = update.$set || update;
  if (target.areaValue !== undefined || target.areaUnit !== undefined) {
    target.areaSqft = toSqft(target.areaValue, target.areaUnit);
  }
  next();
});

export default mongoose.model("Property", propertySchema);
