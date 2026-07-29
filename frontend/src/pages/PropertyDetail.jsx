import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import brand, { typeLabel } from "../data/brand.js";
import { fetchProperty, fetchSimilar } from "../lib/api.js";
import { formatArea, listingTypeLabel, priceParts, priceText, propertyImage } from "../lib/format.js";
import { getSaved, toggleSaved, track } from "../lib/storage.js";
import Gallery from "../components/Gallery.jsx";
import EmiCalculator from "../components/EmiCalculator.jsx";
import EnquiryForm from "../components/EnquiryForm.jsx";
import PriceOnRequest from "../components/PriceOnRequest.jsx";
import PropertyCard from "../components/PropertyCard.jsx";
import { whatsappHref } from "../components/Fabs.jsx";
import { usePageMeta } from "../lib/usePageMeta.js";
import { Bath, Bed, Heart, MapPin, Phone, Ruler, Share, WhatsApp } from "../components/Icons.jsx";

const Spec = ({ label, value }) =>
  value ? (
    <div className="rounded-xl border border-gray-100 p-4">
      <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-base font-extrabold text-navy-700">{value}</dd>
    </div>
  ) : null;

export default function PropertyDetail() {
  const { slug } = useParams();
  const [property, setProperty] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [status, setStatus] = useState("loading");
  const [saved, setSaved] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => setSaved(getSaved()), []);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    window.scrollTo({ top: 0 });

    fetchProperty(slug)
      .then((data) => {
        if (cancelled) return;
        setProperty(data);
        setStatus("ready");
        track("property_view", { slug: data.slug, price: data.price });
      })
      .catch(() => !cancelled && setStatus("missing"));

    fetchSimilar(slug)
      .then((rows) => !cancelled && setSimilar(rows))
      .catch(() => !cancelled && setSimilar([]));

    return () => {
      cancelled = true;
    };
  }, [slug]);

  usePageMeta(
    property
      ? {
          title: `${property.title} — ${priceText(property)} | ${brand.name}`,
          description: property.description?.slice(0, 200) || property.locationText,
          image: propertyImage(property, 1200),
        }
      : { title: `Property — ${brand.name}` },
  );

  if (status === "loading") {
    return (
      <div className="container-page py-24">
        <div className="mx-auto h-8 w-64 animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  if (status === "missing") {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="mb-3 text-3xl font-extrabold text-navy-700">Property not found</h1>
        <p className="mb-8 text-muted">This listing may have been sold or removed.</p>
        <Link to="/properties" className="btn-brand">
          Browse all properties
        </Link>
      </div>
    );
  }

  const { prefix, amount, suffix, note, onRequest } = priceParts(property);
  const isSaved = saved.includes(property.slug);
  const closed = property.status === "sold" || property.status === "rented";
  const shareUrl = `${window.location.origin}/real-estate/${property.slug}`;

  const onShare = async () => {
    track("property_share", { slug: property.slug });
    const payload = { title: property.title, text: priceText(property), url: shareUrl };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        /* user dismissed — fall through to copy */
      }
    }
    await navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="border-b border-gray-100 bg-tint py-4">
        <nav className="container-page text-sm text-muted" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-brand-500">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link to="/properties" className="hover:text-brand-500">
            Properties
          </Link>
          <span className="mx-2">/</span>
          <span className="font-semibold text-navy-700">{property.title}</span>
        </nav>
      </div>

      <section className="py-10">
        <div className="container-page grid gap-10 lg:grid-cols-[1.7fr_1fr]">
          <div>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className="rounded bg-brand-500 px-2.5 py-1 text-[11px] font-bold text-white">
                    {listingTypeLabel(property.listingType)}
                  </span>
                  {(property.labels || []).map((label) => (
                    <span
                      key={label}
                      className={`rounded px-2.5 py-1 text-[11px] font-bold capitalize text-white ${
                        label === "commercial" ? "bg-commercial" : "bg-residential"
                      }`}
                    >
                      {label}
                    </span>
                  ))}
                  {closed && (
                    <span className="rounded bg-navy-700 px-2.5 py-1 text-[11px] font-bold uppercase text-white">
                      {property.status}
                    </span>
                  )}
                </div>

                <h1 className="mb-2 text-3xl leading-tight font-extrabold text-navy-700 sm:text-4xl">
                  {property.title}
                </h1>
                <p className="flex items-start gap-1.5 text-muted">
                  <MapPin size={18} className="mt-0.5 shrink-0" />
                  {property.locationText}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSaved(toggleSaved(property.slug))}
                  aria-pressed={isSaved}
                  aria-label={isSaved ? "Remove from shortlist" : "Save to shortlist"}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${
                    isSaved
                      ? "border-brand-500 bg-brand-50 text-brand-500"
                      : "border-gray-200 text-navy-700 hover:border-brand-500 hover:text-brand-500"
                  }`}
                >
                  <Heart size={20} filled={isSaved} />
                </button>

                <button
                  type="button"
                  onClick={onShare}
                  aria-label="Share this property"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-navy-700 hover:border-brand-500 hover:text-brand-500"
                >
                  <Share size={20} />
                </button>
              </div>
            </div>

            {copied && (
              <p role="status" className="mb-4 text-sm font-bold text-brand-500">
                Link copied to clipboard.
              </p>
            )}

            <Gallery
              images={property.images}
              videos={property.videos}
              title={property.title}
              propertyType={property.propertyType}
            />

            {onRequest ? (
              <div className="mt-6">
                <PriceOnRequest
                  property={property}
                  className="text-3xl font-extrabold text-brand-500 underline decoration-dotted underline-offset-8 hover:opacity-80"
                >
                  {amount}
                </PriceOnRequest>
                <span className="mt-1 block text-sm text-muted">
                  Tap to get the price by call or WhatsApp.
                </span>
              </div>
            ) : (
              <p className="mt-6 flex flex-wrap items-baseline gap-2">
                {prefix && <span className="text-base font-bold text-muted">{prefix}</span>}
                <span className="text-4xl font-extrabold text-brand-500">{amount}</span>
                {suffix && <span className="text-base font-bold text-muted">{suffix}</span>}
                {note && <span className="text-sm font-semibold text-muted">{note}</span>}
              </p>
            )}

            <dl className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Spec label="Property type" value={typeLabel(property.propertyType)} />
              <Spec label="Area" value={formatArea(property)} />
              <Spec
                label="Area in sq.ft"
                value={property.areaSqft ? `${property.areaSqft.toLocaleString("en-IN")} sq.ft` : ""}
              />
              <Spec label="Bedrooms" value={property.bedrooms || ""} />
              <Spec label="Bathrooms" value={property.bathrooms || ""} />
              <Spec label="Facing" value={property.facing} />
              <Spec label="Furnishing" value={property.furnishing} />
              <Spec label="City" value={property.city} />
              <Spec label="Pincode" value={property.pincode} />
            </dl>

            {property.description && (
              <div className="mt-9">
                <h2 className="mb-3 text-2xl font-extrabold text-navy-700">Description</h2>
                <p className="leading-relaxed whitespace-pre-line text-muted">
                  {property.description}
                </p>
              </div>
            )}

            {property.amenities?.length > 0 && (
              <div className="mt-9">
                <h2 className="mb-4 text-2xl font-extrabold text-navy-700">Features & amenities</h2>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {property.amenities.map((amenity) => (
                    <li
                      key={amenity}
                      className="flex items-center gap-2 rounded-lg bg-tint px-3.5 py-2.5 text-sm font-semibold text-navy-700"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-9">
              <h2 className="mb-4 text-2xl font-extrabold text-navy-700">Location</h2>
              <div className="overflow-hidden rounded-2xl border border-gray-100">
                <iframe
                  title={`Map showing ${property.locationText}`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    property.latitude && property.longitude
                      ? `${property.latitude},${property.longitude}`
                      : property.locationText || property.city,
                  )}&output=embed`}
                  className="h-80 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>

          {/* ---------------- Sidebar ---------------- */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="card p-6">
              <p className="mb-4 text-sm font-bold text-navy-700">Prefer to talk?</p>
              <a
                href={`tel:${brand.phones[0].replace(/\s/g, "")}`}
                onClick={() => track("call_click", { slug: property.slug })}
                className="btn-outline mb-3 w-full"
              >
                <Phone size={18} /> {brand.phones[0]}
              </a>
              <a
                href={whatsappHref(
                  `Hi ${brand.name}, I'm interested in "${property.title}" (${priceText(
                    property,
                  )}). ${shareUrl}`,
                )}
                target="_blank"
                rel="noreferrer noopener"
                onClick={() => track("whatsapp_click", { slug: property.slug })}
                className="btn w-full bg-chat text-white hover:brightness-95"
              >
                <WhatsApp size={18} /> Share on WhatsApp
              </a>
            </div>

            <EnquiryForm property={property} />

            {/* An EMI schedule off a withheld or missing price would be meaningless. */}
            {property.listingType === "sale" && !onRequest && (
              <EmiCalculator price={property.price} />
            )}
          </aside>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="bg-tint py-16">
          <div className="container-page">
            <h2 className="mb-8 text-center text-3xl font-extrabold text-navy-700">
              Similar properties
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((item) => (
                <PropertyCard key={item.slug} property={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
