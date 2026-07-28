import mongoose from "mongoose";
import { toSqft } from "../../shared/units.js";
import { LISTING_TYPES, PROPERTY_TYPES, LABELS, STATUSES } from "../query.js";

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    description: { type: String, trim: true, default: "" },

    listingType: { type: String, enum: LISTING_TYPES, default: "sale", index: true },
    propertyType: { type: String, enum: PROPERTY_TYPES, default: "plot", index: true },
    labels: [{ type: String, enum: LABELS }],
    status: { type: String, enum: STATUSES, default: "available", index: true },

    // Price display is not a single number on the reference site — see priceSuffix etc.
    // `price` stays numeric so sorting and range filters remain meaningful.
    price: { type: Number, required: true, index: true },
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

    images: [{ type: String, trim: true }],
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
