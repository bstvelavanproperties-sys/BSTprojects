import { Link } from "react-router-dom";
import { saleStage } from "@bstv/shared/saleStage.js";
import { formatArea, priceParts, propertyImage } from "../lib/format.js";
import CompareToggle from "./CompareToggle.jsx";
import { Bed, Bath, MapPin, Ruler } from "./Icons.jsx";
import PriceOnRequest from "./PriceOnRequest.jsx";
import SaleStageMark from "./SaleStageMark.jsx";

const labelStyle = {
  commercial: "bg-commercial",
  residential: "bg-residential",
};

export default function PropertyCard({ property }) {
  const { prefix, amount, suffix, note, onRequest } = priceParts(property);
  const area = formatArea(property);
  const stage = saleStage(property);
  // Only a finished sale drains the colour out of the photograph — a deal still in
  // progress is live inventory as far as the visitor is concerned.
  const settled = stage === "closed";

  return (
    <article className="card group relative flex h-full flex-col overflow-hidden transition-shadow hover:shadow-[0_10px_36px_rgba(20,49,95,0.14)]">
      <Link
        to={`/real-estate/${property.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-gray-100"
        tabIndex={-1}
        aria-hidden="true"
      >
        <img
          src={propertyImage(property, 640)}
          alt=""
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            settled ? "grayscale" : ""
          }`}
        />

        <div
          className={`absolute left-3 flex flex-wrap gap-1.5 ${
            stage === "processing" ? "top-10" : "top-3"
          }`}
        >
          {(property.labels || []).map((label) => (
            <span
              key={label}
              className={`rounded px-2.5 py-1 text-[11px] font-bold capitalize text-white ${
                labelStyle[label] || "bg-navy-700"
              }`}
            >
              {label}
            </span>
          ))}
        </div>

        <SaleStageMark property={property} />
      </Link>

      {/* Sits outside the link so it doesn't navigate when clicked. */}
      <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 max-lg:opacity-100">
        <CompareToggle slug={property.slug} />
      </div>

      {/* Price chip overlaps the image's bottom edge, as on the reference. */}
      <div className="relative -mt-7 px-4">
        {onRequest ? (
          <PriceOnRequest
            property={property}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-base font-extrabold text-brand-500 underline decoration-dotted underline-offset-4 shadow-[0_4px_18px_rgba(20,49,95,0.12)] hover:bg-brand-50"
          >
            {amount}
          </PriceOnRequest>
        ) : (
          <p className="inline-flex flex-wrap items-baseline gap-1.5 rounded-xl bg-white px-4 py-2.5 shadow-[0_4px_18px_rgba(20,49,95,0.12)]">
            {prefix && <span className="text-xs font-bold text-muted">{prefix}</span>}
            <span className="text-lg font-extrabold text-brand-500">{amount}</span>
            {suffix && <span className="text-xs font-bold text-muted">{suffix}</span>}
            {note && <span className="text-xs font-semibold text-muted">{note}</span>}
          </p>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-5 pt-3">
        <h3 className="mb-2 text-[17px] leading-snug font-extrabold text-navy-700">
          <Link to={`/real-estate/${property.slug}`} className="hover:text-brand-500">
            {property.title}
          </Link>
        </h3>

        <p className="mb-3 flex items-start gap-1.5 text-sm text-muted">
          <MapPin size={16} className="mt-0.5 shrink-0" />
          <span>{property.locationText || `${property.locality}, ${property.city}`}</span>
        </p>

        {(property.bedrooms > 0 || property.bathrooms > 0 || area) && (
          <ul className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-gray-100 pt-3 text-[13px] font-semibold text-muted">
            {property.bedrooms > 0 && (
              <li className="flex items-center gap-1.5">
                <Bed size={16} /> {property.bedrooms} Beds
              </li>
            )}
            {property.bathrooms > 0 && (
              <li className="flex items-center gap-1.5">
                <Bath size={16} /> {property.bathrooms} Baths
              </li>
            )}
            {area && (
              <li className="flex items-center gap-1.5">
                <Ruler size={16} /> {area}
              </li>
            )}
          </ul>
        )}
      </div>
    </article>
  );
}

export const PropertyCardSkeleton = () => (
  <div className="card overflow-hidden">
    <div className="aspect-[4/3] animate-pulse bg-gray-100" />
    <div className="space-y-3 p-4">
      <div className="h-6 w-28 animate-pulse rounded bg-gray-100" />
      <div className="h-5 w-full animate-pulse rounded bg-gray-100" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
    </div>
  </div>
);
