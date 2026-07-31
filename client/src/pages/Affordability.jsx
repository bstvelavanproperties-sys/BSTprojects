import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProperties } from "../lib/api.js";
import { formatFullINR, formatINR } from "../lib/format.js";
import { track } from "../lib/storage.js";
import PropertyCard, { PropertyCardSkeleton } from "../components/PropertyCard.jsx";
import { pageMetaFor } from "@bstv/shared/pageMeta.js";
import { usePageMeta } from "../lib/usePageMeta.js";
import { ArrowRight } from "../components/Icons.jsx";

// The inverse of a normal EMI calculator: given what someone can pay each month,
// how much property does that actually buy?
//   P = EMI · ((1+r)^n − 1) / (r · (1+r)^n)
const loanFromEmi = (emi, annualRate, years) => {
  const r = annualRate / 12 / 100;
  const n = years * 12;
  if (emi <= 0 || n <= 0) return 0;
  if (r === 0) return emi * n;
  const factor = (1 + r) ** n;
  return (emi * (factor - 1)) / (r * factor);
};

const Slider = ({ id, label, value, display, min, max, step, onChange, hint }) => (
  <div>
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label htmlFor={id} className="text-sm font-bold text-navy-700">
        {label}
      </label>
      <span className="text-sm font-extrabold text-brand-500">{display}</span>
    </div>
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full accent-brand-500"
    />
    {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
  </div>
);

export default function Affordability() {
  const navigate = useNavigate();
  const [emi, setEmi] = useState(60000);
  const [savings, setSavings] = useState(2000000);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);
  const [matches, setMatches] = useState({ items: [], total: 0, loading: true });

  usePageMeta(pageMetaFor("/affordability"));

  const loan = useMemo(() => loanFromEmi(emi, rate, years), [emi, rate, years]);
  const budget = Math.round(loan + savings);
  const totalInterest = Math.round(emi * years * 12 - loan);

  // Debounced — the sliders fire continuously.
  useEffect(() => {
    setMatches((prev) => ({ ...prev, loading: true }));
    const timer = setTimeout(() => {
      fetchProperties({ listingType: "sale", maxPrice: budget, sort: "price-desc", limit: 4 })
        .then((data) => setMatches({ ...data, loading: false }))
        .catch(() => setMatches({ items: [], total: 0, loading: false }));
    }, 350);
    return () => clearTimeout(timer);
  }, [budget]);

  return (
    <>
      <section className="bg-navy-900 py-14">
        <div className="container-page text-center">
          <p className="mb-2 text-sm font-extrabold tracking-widest text-brand-500 uppercase">
            Affordability
          </p>
          <h1 className="mb-3 text-4xl font-extrabold text-white sm:text-5xl">
            What can I actually afford?
          </h1>
          <p className="mx-auto max-w-xl text-white/70">
            Most calculators start with a house and tell you the EMI. This one starts with what you
            can comfortably pay each month — and shows you what that buys.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div className="card h-fit p-7">
            <h2 className="mb-6 text-xl font-extrabold text-navy-700">Your numbers</h2>

            <div className="space-y-6">
              <Slider
                id="a-emi"
                label="Monthly payment you're comfortable with"
                value={emi}
                display={formatFullINR(emi)}
                min={10000}
                max={500000}
                step={5000}
                onChange={setEmi}
                hint="Lenders usually cap this near 40–50% of take-home pay."
              />
              <Slider
                id="a-savings"
                label="Down payment you have ready"
                value={savings}
                display={formatINR(savings)}
                min={0}
                max={50000000}
                step={500000}
                onChange={setSavings}
                hint="Most banks fund 75–80% of the property value."
              />
              <Slider
                id="a-rate"
                label="Interest rate"
                value={rate}
                display={`${rate}%`}
                min={6}
                max={15}
                step={0.1}
                onChange={setRate}
              />
              <Slider
                id="a-years"
                label="Loan term"
                value={years}
                display={`${years} years`}
                min={1}
                max={30}
                step={1}
                onChange={setYears}
              />
            </div>
          </div>

          <div>
            <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-8 text-center text-white">
              <p className="mb-1.5 text-sm font-bold text-white/75">
                You could be looking at properties around
              </p>
              <p className="mb-1 text-5xl font-extrabold">{formatINR(budget)}</p>
              <p className="text-sm text-white/75">{formatFullINR(budget)}</p>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[
                ["Loan you'd take", formatINR(Math.round(loan))],
                ["Your down payment", formatINR(savings)],
                ["Interest over term", formatINR(totalInterest)],
              ].map(([label, value]) => (
                <div key={label} className="card p-4">
                  <dt className="mb-1 text-xs text-muted">{label}</dt>
                  <dd className="font-extrabold text-navy-700">{value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-4 rounded-xl bg-tint p-4 text-xs leading-relaxed text-muted">
              An estimate only. Banks assess income, existing obligations and credit history, and
              registration, stamp duty and maintenance sit on top of the price shown. Treat this as a
              starting point for the conversation, not an approval.
            </p>

            <div className="mt-8">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-xl font-extrabold text-navy-700">
                  In your range right now
                </h2>
                {!matches.loading && matches.total > 0 && (
                  <span className="text-sm font-bold text-muted">{matches.total} available</span>
                )}
              </div>

              {matches.loading ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <PropertyCardSkeleton />
                  <PropertyCardSkeleton />
                </div>
              ) : matches.items.length ? (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {matches.items.map((property) => (
                      <PropertyCard key={property.slug} property={property} />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      track("affordability_browse", { budget });
                      navigate(`/properties?listingType=sale&maxPrice=${budget}&sort=price-desc`);
                    }}
                    className="btn-brand mt-6 w-full"
                  >
                    See all {matches.total} in this range
                    <ArrowRight size={18} />
                  </button>
                </>
              ) : (
                <div className="card p-10 text-center">
                  <p className="mb-2 font-extrabold text-navy-700">
                    Nothing listed under {formatINR(budget)} yet
                  </p>
                  <p className="text-sm text-muted">
                    Try raising the monthly figure or the term — or tell us your budget and we'll
                    look off-market.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
