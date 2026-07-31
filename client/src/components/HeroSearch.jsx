import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { propertyLabels, propertyTypes } from "../config/brand.js";
import { fetchCities } from "../lib/api.js";
import { cityOptions } from "../lib/cityOptions.js";
import { track } from "../lib/storage.js";
import { ChevronDown, Home, MapPin, Search, Sliders } from "./Icons.jsx";

const Select = ({ id, icon: Icon, value, onChange, placeholder, options, labelText }) => (
  <div className="relative">
    <label htmlFor={id} className="sr-only">
      {labelText}
    </label>
    <Icon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" />
    <select
      id={id}
      value={value}
      onChange={onChange}
      className="field appearance-none pl-11 pr-9 font-semibold"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
  </div>
);

export default function HeroSearch() {
  const navigate = useNavigate();
  const [listingType, setListingType] = useState("sale");
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState({ q: "", city: "", propertyType: "", label: "" });

  useEffect(() => {
    fetchCities()
      .then(setCities)
      .catch(() => setCities([]));
  }, []);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const onSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams({ listingType });
    Object.entries(form).forEach(([key, value]) => value && params.set(key, value));
    track("hero_search", { listingType, ...form });
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Buy / Rent tabs sit on top of the card, as on the reference. */}
      <div className="flex" role="tablist" aria-label="Listing type">
        {[
          { key: "sale", label: "Buy" },
          { key: "rent", label: "Rent" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={listingType === tab.key}
            onClick={() => setListingType(tab.key)}
            className={`w-28 rounded-t-xl py-3 text-sm font-extrabold transition-colors ${
              listingType === tab.key ? "bg-brand-500 text-white" : "bg-white/90 text-navy-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl rounded-tl-none bg-white p-4 shadow-[0_10px_40px_rgba(0,0,0,0.18)]"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1.1fr_1.2fr_1.2fr_auto]">
          <div className="relative">
            <label htmlFor="hero-q" className="sr-only">
              Search by keyword or locality
            </label>
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" />
            <input
              id="hero-q"
              className="field pl-11"
              placeholder="Enter Keyword..."
              value={form.q}
              onChange={set("q")}
            />
          </div>

          <Select
            id="hero-city"
            icon={MapPin}
            labelText="City"
            placeholder="All Cities"
            value={form.city}
            onChange={set("city")}
            options={cityOptions(cities)}
          />

          <Select
            id="hero-type"
            icon={Home}
            labelText="Property type"
            placeholder="Property Types"
            value={form.propertyType}
            onChange={set("propertyType")}
            options={propertyTypes.map((type) => ({ value: type.slug, label: type.label }))}
          />

          <Select
            id="hero-label"
            icon={Sliders}
            labelText="Property label"
            placeholder="Property Labels"
            value={form.label}
            onChange={set("label")}
            options={propertyLabels.map((label) => ({ value: label.slug, label: label.label }))}
          />

          <button type="submit" className="btn-brand h-11.5 px-7 sm:col-span-2 lg:col-span-1">
            Search Now
            <Search size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
