import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCompare } from "../lib/CompareContext.jsx";
import { fetchProperty } from "../lib/api.js";
import { formatArea, priceText, propertyImage } from "../lib/format.js";
import { typeLabel } from "../data/brand.js";
import { track } from "../lib/storage.js";
import { Close } from "./Icons.jsx";

// ---------------------------------------------------------------------------
// Docked bar — appears as soon as something is selected.
// ---------------------------------------------------------------------------
export function CompareBar() {
  const { slugs, clear, setOpen, max } = useCompare();
  if (!slugs.length) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-navy-900/95 backdrop-blur">
      <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
        <p className="text-sm font-bold text-white">
          {slugs.length} of {max} selected to compare
        </p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={clear} className="px-3 text-sm font-bold text-white/60 hover:text-white">
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              track("compare_open", { count: slugs.length });
            }}
            disabled={slugs.length < 2}
            className="btn-brand py-2.5 disabled:opacity-45"
          >
            {slugs.length < 2 ? "Pick one more" : "Compare now"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Full-screen side-by-side. Best value in each row is highlighted.
// ---------------------------------------------------------------------------
export function ComparePanel() {
  const { slugs, open, setOpen, remove, clear } = useCompare();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !slugs.length) return;
    setLoading(true);
    Promise.all(slugs.map((slug) => fetchProperty(slug).catch(() => null)))
      .then((rows) => setItems(rows.filter(Boolean)))
      .finally(() => setLoading(false));
  }, [open, slugs]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, setOpen]);

  if (!open) return null;

  // Rows marked `best` get the winning cell highlighted.
  const rows = [
    { label: "Price", get: (p) => priceText(p), best: "min", raw: (p) => p.price },
    { label: "Type", get: (p) => typeLabel(p.propertyType) },
    { label: "Area", get: (p) => formatArea(p) || "—", best: "max", raw: (p) => p.areaSqft },
    {
      label: "Price per sq.ft",
      get: (p) => (p.areaSqft ? `₹${Math.round(p.price / p.areaSqft).toLocaleString("en-IN")}` : "—"),
      best: "min",
      raw: (p) => (p.areaSqft ? p.price / p.areaSqft : Infinity),
    },
    { label: "Bedrooms", get: (p) => p.bedrooms || "—", best: "max", raw: (p) => p.bedrooms || 0 },
    { label: "Bathrooms", get: (p) => p.bathrooms || "—", best: "max", raw: (p) => p.bathrooms || 0 },
    { label: "Facing", get: (p) => p.facing || "—" },
    { label: "Furnishing", get: (p) => p.furnishing || "—" },
    { label: "City", get: (p) => p.city },
    { label: "Locality", get: (p) => p.locality || "—" },
    { label: "Amenities", get: (p) => p.amenities?.length || 0, best: "max", raw: (p) => p.amenities?.length || 0 },
  ];

  const winners = (row) => {
    if (!row.best || items.length < 2) return new Set();
    const values = items.map(row.raw);
    const target = row.best === "min" ? Math.min(...values) : Math.max(...values);
    if (!Number.isFinite(target)) return new Set();
    // Not a "win" if everything ties.
    if (values.every((value) => value === target)) return new Set();
    return new Set(values.map((value, index) => (value === target ? index : -1)).filter((i) => i >= 0));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Compare properties"
      className="fixed inset-0 z-[70] overflow-y-auto bg-white"
    >
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <h2 className="text-xl font-extrabold text-navy-700">Compare properties</h2>
          <div className="flex items-center gap-3">
            <button type="button" onClick={clear} className="text-sm font-bold text-muted hover:text-brand-500">
              Clear all
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close comparison"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-navy-700 hover:border-brand-500 hover:text-brand-500"
            >
              <Close size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="container-page py-8">
        {loading ? (
          <p className="py-20 text-center text-muted">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="w-40 p-3" />
                  {items.map((property) => (
                    <th key={property.slug} className="p-3 align-top">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => remove(property.slug)}
                          aria-label={`Remove ${property.title} from comparison`}
                          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-navy-700 shadow hover:text-brand-500"
                        >
                          <Close size={15} />
                        </button>
                        <img
                          src={propertyImage(property, 400)}
                          alt=""
                          className="mb-3 aspect-[4/3] w-full rounded-xl object-cover"
                        />
                        <Link
                          to={`/real-estate/${property.slug}`}
                          onClick={() => setOpen(false)}
                          className="block text-[15px] leading-snug font-extrabold text-navy-700 hover:text-brand-500"
                        >
                          {property.title}
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const best = winners(row);
                  return (
                    <tr key={row.label} className="border-t border-gray-100">
                      <th scope="row" className="p-3 text-sm font-bold text-muted">
                        {row.label}
                      </th>
                      {items.map((property, index) => (
                        <td
                          key={property.slug}
                          className={`p-3 text-sm font-bold ${
                            best.has(index)
                              ? "rounded-lg bg-brand-50 text-brand-600"
                              : "text-navy-700"
                          }`}
                        >
                          {row.get(property)}
                          {best.has(index) && (
                            <span className="ml-1.5 text-[10px] font-extrabold tracking-wide uppercase">
                              best
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                <tr className="border-t border-gray-100">
                  <td className="p-3" />
                  {items.map((property) => (
                    <td key={property.slug} className="p-3">
                      <Link
                        to={`/real-estate/${property.slug}`}
                        onClick={() => setOpen(false)}
                        className="btn-brand w-full py-2.5"
                      >
                        View details
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-xs text-muted">
          “Best” marks the strongest value in each row across the properties shown — lowest price and
          price per sq.ft, highest area, bedrooms and amenity count. It is not a recommendation.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The toggle that lives on each property card.
// ---------------------------------------------------------------------------
export function CompareToggle({ slug, className = "" }) {
  const { has, toggle, max } = useCompare();
  const [full, setFull] = useState(false);
  const selected = has(slug);

  const onClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const ok = toggle(slug);
    if (!ok) {
      setFull(true);
      setTimeout(() => setFull(false), 2200);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={full ? `You can compare up to ${max}` : "Add to comparison"}
      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold transition-colors ${
        selected
          ? "bg-brand-500 text-white"
          : full
            ? "bg-navy-700 text-white"
            : "bg-white/90 text-navy-700 hover:bg-white"
      } ${className}`}
    >
      {full ? `Max ${max}` : selected ? "✓ Comparing" : "Compare"}
    </button>
  );
}
