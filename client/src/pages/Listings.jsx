import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import brand, { propertyLabels, propertyTypes } from "../config/brand.js";
import { fetchCities, fetchProperties } from "../lib/api.js";
import { formatINR } from "../lib/format.js";
import { track } from "../lib/storage.js";
import { whatsappHref, whatsappNumber } from "../lib/whatsapp.js";
import PropertyCard, { PropertyCardSkeleton } from "../components/PropertyCard.jsx";
import { pageMetaFor } from "@bstv/shared/pageMeta.js";
import { usePageMeta } from "../lib/usePageMeta.js";
import { useReveal, revealDelay } from "../lib/useReveal.js";
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  Search,
  Sliders,
  WhatsApp,
} from "../components/Icons.jsx";

// Sale runs ₹50L–₹6Cr; rent runs ₹15K–₹1.5L a month. One slider for both is meaningless,
// so the bounds follow the active listing type.
const PRICE_BOUNDS = {
  sale: { min: 0, max: 80000000, step: 500000 },
  rent: { min: 0, max: 300000, step: 5000 },
};

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "area-desc", label: "Area: large to small" },
  { value: "area-asc", label: "Area: small to large" },
];

// `metaPath` names which entry in shared/pageMeta.js this route uses. One component serves
// /properties, /buy and /rent, and each needs its own title — "Property for Sale in Chennai"
// and "Property for Rent in Chennai" are different searches.
export default function Listings({ fixedListingType, heading, metaPath = "/properties" }) {
  const [params, setParams] = useSearchParams();
  const [cities, setCities] = useState([]);
  const [state, setState] = useState({ items: [], total: 0, page: 1, pages: 1, loading: true });
  const [showFilters, setShowFilters] = useState(false);
  const reveal = useReveal([state.items]);

  const listingType = fixedListingType || params.get("listingType") || "";
  const bounds = PRICE_BOUNDS[listingType] || PRICE_BOUNDS.sale;

  const [keyword, setKeyword] = useState(params.get("q") || "");

  const query = useMemo(
    () => ({
      q: params.get("q") || "",
      city: params.get("city") || "",
      listingType,
      propertyType: params.get("propertyType") || "",
      label: params.get("label") || "",
      bedrooms: params.get("bedrooms") || "",
      nriFriendly: params.get("nriFriendly") || "",
      minPrice: params.get("minPrice") || "",
      maxPrice: params.get("maxPrice") || "",
      sort: params.get("sort") || "newest",
      page: params.get("page") || "1",
      limit: 12,
    }),
    [params, listingType],
  );

  usePageMeta(pageMetaFor(metaPath));

  // Keep the input in sync when the URL changes from outside (nav links, back button).
  useEffect(() => setKeyword(params.get("q") || ""), [params]);

  // Debounce the keyword so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const current = params.get("q") || "";
    if (keyword === current) return undefined;
    const timer = setTimeout(() => update({ q: keyword, page: "1" }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    // Browsing is the one surface that shows sold and rented stock — a closed sale is
    // proof the agency delivers. The API ranks them after available listings, so live
    // inventory still leads. Kept out of the URL: it is a property of this page, not a
    // filter the visitor set.
    fetchProperties({ ...query, includeClosed: "true" })
      .then((data) => !cancelled && setState({ ...data, loading: false, failed: false }))
      // Distinguished from an empty result on purpose. fetchProperties used to answer
      // with bundled demo listings when the API was unreachable, so an outage looked
      // like a healthy catalogue; now that it throws, "no matches" and "we couldn't
      // reach the server" must not render as the same screen either.
      .catch(
        () =>
          !cancelled &&
          setState({ items: [], total: 0, page: 1, pages: 1, loading: false, failed: true }),
      );

    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    fetchCities()
      .then(setCities)
      .catch(() => setCities([]));
  }, []);

  const update = useCallback(
    (changes) => {
      const next = new URLSearchParams(params);
      Object.entries(changes).forEach(([key, value]) => {
        if (value === "" || value === null || value === undefined) next.delete(key);
        else next.set(key, value);
      });
      if (!("page" in changes)) next.set("page", "1");
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const clearAll = () => {
    const next = new URLSearchParams();
    if (fixedListingType) next.set("listingType", fixedListingType);
    setParams(next, { replace: true });
    setKeyword("");
  };

  const activeCount = [
    "city",
    "propertyType",
    "label",
    "bedrooms",
    "nriFriendly",
    "minPrice",
    "maxPrice",
  ].filter((key) => params.get(key)).length;

  const goToPage = (page) => {
    update({ page: String(page) });
    window.scrollTo({ top: 0, behavior: "smooth" });
    track("listings_paginate", { page });
  };

  return (
    <>
      <section className="bg-navy-900 py-14">
        <div className="container-page text-center">
          <h1 className="mb-2 text-4xl font-extrabold text-white sm:text-5xl">
            {heading || "All Properties"}
          </h1>
          <p className="text-white/70">
            {state.loading
              ? "Searching…"
              : `${state.total} ${state.total === 1 ? "property" : "properties"} available`}
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-page grid gap-8 lg:grid-cols-[290px_1fr]">
          {/* ---------------- Filters ---------------- */}
          <aside>
            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className="btn-outline mb-4 w-full lg:hidden"
              aria-expanded={showFilters}
            >
              <Sliders size={18} />
              Filters{activeCount ? ` (${activeCount})` : ""}
            </button>

            <div className={`card p-6 ${showFilters ? "block" : "hidden"} lg:block`}>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-navy-700">Filters</h2>
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-sm font-bold text-brand-500 hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="f-q" className="mb-1.5 block text-sm font-bold text-navy-700">
                    Keyword
                  </label>
                  <div className="relative">
                    <Search
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                      id="f-q"
                      className="field pl-10"
                      placeholder="Locality, title…"
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                    />
                  </div>
                </div>

                {!fixedListingType && (
                  <div>
                    <span className="mb-1.5 block text-sm font-bold text-navy-700">Looking to</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "", label: "Any" },
                        { value: "sale", label: "Buy" },
                        { value: "rent", label: "Rent" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            update({ listingType: option.value, minPrice: "", maxPrice: "" })
                          }
                          className={`rounded-lg border py-2 text-sm font-bold transition-colors ${
                            listingType === option.value
                              ? "border-brand-500 bg-brand-50 text-brand-500"
                              : "border-gray-200 text-navy-700 hover:border-brand-300"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="f-city" className="mb-1.5 block text-sm font-bold text-navy-700">
                    City
                  </label>
                  <select
                    id="f-city"
                    className="field"
                    value={query.city}
                    onChange={(event) => update({ city: event.target.value })}
                  >
                    <option value="">All cities</option>
                    {cities.map((row) => (
                      <option key={row.city} value={row.city}>
                        {row.city} ({row.count})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="f-type" className="mb-1.5 block text-sm font-bold text-navy-700">
                    Property type
                  </label>
                  <select
                    id="f-type"
                    className="field"
                    value={query.propertyType}
                    onChange={(event) => update({ propertyType: event.target.value })}
                  >
                    <option value="">All types</option>
                    {propertyTypes.map((type) => (
                      <option key={type.slug} value={type.slug}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="f-label" className="mb-1.5 block text-sm font-bold text-navy-700">
                    Category
                  </label>
                  <select
                    id="f-label"
                    className="field"
                    value={query.label}
                    onChange={(event) => update({ label: event.target.value })}
                  >
                    <option value="">Any</option>
                    {propertyLabels.map((label) => (
                      <option key={label.slug} value={label.slug}>
                        {label.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="f-beds" className="mb-1.5 block text-sm font-bold text-navy-700">
                    Bedrooms (minimum)
                  </label>
                  <select
                    id="f-beds"
                    className="field"
                    value={query.bedrooms}
                    onChange={(event) => update({ bedrooms: event.target.value })}
                  >
                    <option value="">Any</option>
                    {[1, 2, 3, 4, 5].map((count) => (
                      <option key={count} value={count}>
                        {count}+
                      </option>
                    ))}
                  </select>
                </div>

                {/* Opt-in narrowing, so it reads as "only these" rather than a
                    preference that quietly excludes the rest of the catalogue. */}
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={query.nriFriendly === "true"}
                    onChange={(event) =>
                      update({ nriFriendly: event.target.checked ? "true" : "" })
                    }
                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500"
                  />
                  <span>
                    <span className="block text-sm font-bold text-navy-700">
                      NRI-friendly only
                    </span>
                    <span className="block text-xs leading-relaxed text-muted">
                      Listings we can handle end to end for a buyer living abroad.
                    </span>
                  </span>
                </label>

                {/* Price only makes sense once buy-vs-rent is chosen. */}
                <div>
                  <span className="mb-1.5 block text-sm font-bold text-navy-700">
                    Maximum price
                    {listingType === "rent" && (
                      <span className="font-semibold text-muted"> (per month)</span>
                    )}
                  </span>

                  {listingType ? (
                    <>
                      <input
                        type="range"
                        aria-label="Maximum price"
                        min={bounds.min}
                        max={bounds.max}
                        step={bounds.step}
                        value={query.maxPrice || bounds.max}
                        onChange={(event) => update({ maxPrice: event.target.value })}
                        className="w-full accent-brand-500"
                      />
                      <p className="mt-1 text-sm font-bold text-brand-500">
                        Up to {formatINR(query.maxPrice || bounds.max)}
                        {listingType === "rent" ? " / month" : ""}
                      </p>
                    </>
                  ) : (
                    <p className="rounded-lg bg-tint px-3 py-2.5 text-xs leading-relaxed text-muted">
                      Choose <strong className="text-navy-700">Buy</strong> or{" "}
                      <strong className="text-navy-700">Rent</strong> first — sale prices and monthly
                      rents can't share one range.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* ---------------- Results ---------------- */}
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                {state.loading ? "Loading…" : `Showing ${state.items.length} of ${state.total}`}
              </p>

              <div className="flex items-center gap-2">
                <label htmlFor="f-sort" className="text-sm font-bold text-navy-700">
                  Sort
                </label>
                <select
                  id="f-sort"
                  className="field w-auto py-2"
                  value={query.sort}
                  onChange={(event) => update({ sort: event.target.value })}
                >
                  {SORTS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {state.loading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <PropertyCardSkeleton key={index} />
                ))}
              </div>
            ) : state.items.length ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" ref={reveal}>
                {state.items.map((property, index) => (
                  <div key={property.slug} className="reveal" style={revealDelay(index)}>
                    <PropertyCard property={property} />
                  </div>
                ))}
              </div>
            ) : state.failed ? (
              <div className="card p-14 text-center">
                <p className="mb-2 text-lg font-extrabold text-brand-500">
                  Listings are unavailable
                </p>
                <p className="mb-6 text-sm text-muted">
                  We couldn't load the catalogue just now. Please try again in a moment — or call
                  us and we'll talk you through what's available.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button type="button" onClick={() => update({})} className="btn-brand">
                    Try again
                  </button>
                  <a href={`tel:${brand.phones[0].replace(/\s/g, "")}`} className="btn-outline">
                    <Phone size={18} /> {brand.phones[0]}
                  </a>
                  <a
                    href={whatsappHref(
                      `Hi ${brand.name}, I'd like to know what properties you have available.`,
                    )}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn bg-chat text-white hover:brightness-95"
                  >
                    <WhatsApp size={18} /> WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              // Never a dead end: a search that matched nothing is the moment to hand
              // the visitor a person, so the numbers lead and the filters come second.
              <div className="card p-8 text-center sm:p-14">
                <p className="mb-2 text-lg font-extrabold text-navy-700">
                  Nothing matches those filters
                </p>
                <p className="mx-auto mb-7 max-w-md text-sm text-muted">
                  A good part of our inventory never gets listed publicly. Call or WhatsApp us
                  with what you&apos;re looking for and we&apos;ll search on your behalf.
                </p>

                <div className="mx-auto mb-6 grid max-w-lg gap-3 sm:grid-cols-2">
                  <a
                    href={`tel:${brand.phones[0].replace(/\s/g, "")}`}
                    onClick={() => track("listings_empty_call")}
                    className="btn-brand w-full flex-col gap-1 py-4"
                  >
                    <span className="flex items-center gap-2 text-xs font-bold tracking-wide uppercase opacity-90">
                      <Phone size={16} /> Call
                    </span>
                    <span className="text-base font-extrabold">{brand.phones[0]}</span>
                  </a>

                  <a
                    href={whatsappHref(
                      `Hi ${brand.name}, I couldn't find what I'm looking for on the site${
                        query.city ? ` in ${query.city}` : ""
                      }. Could you help?`,
                    )}
                    target="_blank"
                    rel="noreferrer noopener"
                    onClick={() => track("listings_empty_whatsapp")}
                    className="btn w-full flex-col gap-1 bg-chat py-4 text-white hover:brightness-95"
                  >
                    <span className="flex items-center gap-2 text-xs font-bold tracking-wide uppercase opacity-90">
                      <WhatsApp size={16} /> WhatsApp
                    </span>
                    <span className="text-base font-extrabold">{whatsappNumber}</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={clearAll}
                  className="text-sm font-bold text-brand-500 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}

            {state.pages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
                <button
                  type="button"
                  onClick={() => goToPage(state.page - 1)}
                  disabled={state.page <= 1}
                  aria-label="Previous page"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-navy-700 disabled:opacity-40 hover:enabled:border-brand-500 hover:enabled:text-brand-500"
                >
                  <ChevronLeft size={18} />
                </button>

                {Array.from({ length: state.pages }, (_, index) => index + 1)
                  .filter(
                    (page) =>
                      page === 1 || page === state.pages || Math.abs(page - state.page) <= 1,
                  )
                  .map((page, index, list) => (
                    <span key={page} className="flex items-center gap-2">
                      {index > 0 && list[index - 1] !== page - 1 && (
                        <span className="text-muted">…</span>
                      )}
                      <button
                        type="button"
                        onClick={() => goToPage(page)}
                        aria-current={page === state.page ? "page" : undefined}
                        className={`h-10 w-10 rounded-full text-sm font-bold ${
                          page === state.page
                            ? "bg-brand-500 text-white"
                            : "border border-gray-200 text-navy-700 hover:border-brand-500 hover:text-brand-500"
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  ))}

                <button
                  type="button"
                  onClick={() => goToPage(state.page + 1)}
                  disabled={state.page >= state.pages}
                  aria-label="Next page"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-navy-700 disabled:opacity-40 hover:enabled:border-brand-500 hover:enabled:text-brand-500"
                >
                  <ChevronRight size={18} />
                </button>
              </nav>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
