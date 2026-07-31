import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import brand, { propertyTypes } from "../config/brand.js";
import { fetchCities, fetchProperties, submitLead } from "../lib/api.js";
import { track } from "../lib/storage.js";
import PropertyCard from "../components/PropertyCard.jsx";
import { whatsappHref, whatsappNumber } from "../lib/whatsapp.js";
import { usePageMeta } from "../lib/usePageMeta.js";
import { ArrowRight, ChevronLeft, Phone, Search, WhatsApp } from "../components/Icons.jsx";

const BUDGETS = {
  sale: [
    { label: "Under ₹50 L", max: 5000000 },
    { label: "₹50 L – ₹1 Cr", min: 5000000, max: 10000000 },
    { label: "₹1 Cr – ₹3 Cr", min: 10000000, max: 30000000 },
    { label: "₹3 Cr +", min: 30000000 },
  ],
  rent: [
    { label: "Under ₹25 K / month", max: 25000 },
    { label: "₹25 K – ₹75 K", min: 25000, max: 75000 },
    { label: "₹75 K – ₹1.5 L", min: 75000, max: 150000 },
    { label: "₹1.5 L +", min: 150000 },
  ],
};

const Choice = ({ selected, onClick, title, sub }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-2xl border-2 p-5 text-left transition-all hover:-translate-y-0.5 ${
      selected
        ? "border-brand-500 bg-brand-50 shadow-[0_6px_20px_rgba(220,28,36,0.15)]"
        : "border-gray-200 bg-white hover:border-brand-300"
    }`}
  >
    <span className="block text-base font-extrabold text-navy-700">{title}</span>
    {sub && <span className="mt-0.5 block text-sm text-muted">{sub}</span>}
  </button>
);

export default function Matchmaker() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    listingType: "",
    propertyType: "",
    city: "",
    budget: null,
    bedrooms: "",
  });
  const [cities, setCities] = useState([]);
  const [results, setResults] = useState({ items: [], total: 0, loading: false });
  const [lead, setLead] = useState({ name: "", phone: "", sent: false, error: "" });

  usePageMeta({
    title: `Find My Property — ${brand.name}`,
    description:
      "Answer five quick questions and we'll shortlist the properties that actually fit — then send them to your WhatsApp.",
  });

  useEffect(() => {
    fetchCities()
      .then(setCities)
      .catch(() => setCities([]));
  }, []);

  const needsBedrooms = ["villa", "apartment", "independent-house"].includes(answers.propertyType);

  const steps = useMemo(() => {
    const list = ["listingType", "propertyType", "city", "budget"];
    if (needsBedrooms) list.push("bedrooms");
    return list;
  }, [needsBedrooms]);

  const isResults = step >= steps.length;
  const progress = Math.round((Math.min(step, steps.length) / steps.length) * 100);

  const set = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setStep((current) => current + 1);
  };

  // Run the search once every question is answered.
  useEffect(() => {
    if (!isResults) return;
    setResults((prev) => ({ ...prev, loading: true }));

    const query = {
      listingType: answers.listingType,
      propertyType: answers.propertyType,
      city: answers.city,
      bedrooms: answers.bedrooms,
      minPrice: answers.budget?.min ?? "",
      maxPrice: answers.budget?.max ?? "",
      limit: 6,
      sort: "price-asc",
    };

    track("matchmaker_complete", query);

    fetchProperties(query)
      .then((data) => {
        // Nothing exact? Widen by dropping locality and bedrooms rather than showing a dead end.
        if (data.items.length) return setResults({ ...data, loading: false });
        return fetchProperties({
          listingType: answers.listingType,
          propertyType: answers.propertyType,
          limit: 6,
          sort: "price-asc",
        }).then((wider) => setResults({ ...wider, loading: false, widened: true }));
      })
      .catch(() => setResults({ items: [], total: 0, loading: false }));
  }, [isResults, answers]);

  const summary = [
    answers.listingType === "rent" ? "To rent" : "To buy",
    propertyTypes.find((type) => type.slug === answers.propertyType)?.label,
    answers.city || "Any city",
    answers.budget?.label,
    answers.bedrooms ? `${answers.bedrooms}+ beds` : null,
  ].filter(Boolean);

  const whatsappText = () =>
    [
      `Hi ${brand.name}, here's what I'm looking for:`,
      ...summary.map((line) => `• ${line}`),
      lead.name ? `Name: ${lead.name}` : "",
      "Could you send me matching options?",
    ]
      .filter(Boolean)
      .join("\n");

  const sendLead = async (event) => {
    event.preventDefault();
    if (!lead.name.trim() || !lead.phone.trim()) {
      setLead((prev) => ({ ...prev, error: "Please enter your name and phone number." }));
      return;
    }
    await submitLead({
      name: lead.name,
      phone: lead.phone,
      type: "property-wanted",
      budget: answers.budget?.label || "",
      message: `Matchmaker: ${summary.join(" · ")}`,
    });
    track("matchmaker_lead");
    setLead((prev) => ({ ...prev, sent: true, error: "" }));
    window.open(whatsappHref(whatsappText()), "_blank", "noopener");
  };

  const restart = () => {
    setAnswers({ listingType: "", propertyType: "", city: "", budget: null, bedrooms: "" });
    setResults({ items: [], total: 0, loading: false });
    setLead({ name: "", phone: "", sent: false, error: "" });
    setStep(0);
  };

  return (
    <>
      <section className="bg-navy-900 py-14">
        <div className="container-page text-center">
          <p className="mb-2 text-sm font-extrabold tracking-widest text-brand-500 uppercase">
            Property Matchmaker
          </p>
          <h1 className="mb-3 text-4xl font-extrabold text-white sm:text-5xl">
            {isResults ? "Here's what fits" : "Let's find your property"}
          </h1>
          <p className="mx-auto max-w-xl text-white/70">
            {isResults
              ? "Matched against our live inventory — no forms to fill before you see results."
              : `${steps.length} quick questions. No sign-up, no email wall.`}
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-page max-w-3xl">
          {/* Progress */}
          <div className="mb-9">
            <div className="mb-2 flex items-center justify-between text-sm font-bold text-muted">
              <span>
                {isResults ? "Complete" : `Question ${step + 1} of ${steps.length}`}
              </span>
              <span className="text-brand-500">{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {step > 0 && !isResults && (
            <button
              type="button"
              onClick={() => setStep((current) => current - 1)}
              className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-brand-500"
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}

          {/* ---------------- Questions ---------------- */}
          {!isResults && (
            <div key={step} className="step-in">
              {steps[step] === "listingType" && (
                <>
                  <h2 className="mb-6 text-2xl font-extrabold text-navy-700">
                    Are you looking to buy or rent?
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Choice
                      title="Buy"
                      sub="Own it outright"
                      selected={answers.listingType === "sale"}
                      onClick={() => set("listingType", "sale")}
                    />
                    <Choice
                      title="Rent"
                      sub="Lease month to month"
                      selected={answers.listingType === "rent"}
                      onClick={() => set("listingType", "rent")}
                    />
                  </div>
                </>
              )}

              {steps[step] === "propertyType" && (
                <>
                  <h2 className="mb-6 text-2xl font-extrabold text-navy-700">
                    What kind of property?
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {propertyTypes.map((type) => (
                      <Choice
                        key={type.slug}
                        title={type.label}
                        selected={answers.propertyType === type.slug}
                        onClick={() => set("propertyType", type.slug)}
                      />
                    ))}
                  </div>
                </>
              )}

              {steps[step] === "city" && (
                <>
                  <h2 className="mb-6 text-2xl font-extrabold text-navy-700">Where?</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Choice
                      title="Anywhere"
                      sub="Show me everything"
                      selected={answers.city === ""}
                      onClick={() => set("city", "")}
                    />
                    {cities.map((row) => (
                      <Choice
                        key={row.city}
                        title={row.city}
                        sub={`${row.count} ${row.count === 1 ? "property" : "properties"}`}
                        selected={answers.city === row.city}
                        onClick={() => set("city", row.city)}
                      />
                    ))}
                  </div>
                </>
              )}

              {steps[step] === "budget" && (
                <>
                  <h2 className="mb-6 text-2xl font-extrabold text-navy-700">
                    What's your budget?
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {BUDGETS[answers.listingType || "sale"].map((band) => (
                      <Choice
                        key={band.label}
                        title={band.label}
                        selected={answers.budget?.label === band.label}
                        onClick={() => set("budget", band)}
                      />
                    ))}
                  </div>
                </>
              )}

              {steps[step] === "bedrooms" && (
                <>
                  <h2 className="mb-6 text-2xl font-extrabold text-navy-700">
                    How many bedrooms, minimum?
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {["", "2", "3", "4"].map((count) => (
                      <Choice
                        key={count || "any"}
                        title={count ? `${count}+ BHK` : "Any"}
                        selected={answers.bedrooms === count}
                        onClick={() => set("bedrooms", count)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ---------------- Results ---------------- */}
          {isResults && (
            <div className="step-in">
              <div className="mb-8 flex flex-wrap items-center gap-2">
                {summary.map((line) => (
                  <span
                    key={line}
                    className="rounded-full bg-tint px-3.5 py-1.5 text-sm font-bold text-navy-700"
                  >
                    {line}
                  </span>
                ))}
                <button
                  type="button"
                  onClick={restart}
                  className="text-sm font-bold text-brand-500 hover:underline"
                >
                  Start over
                </button>
              </div>

              {results.loading ? (
                <p className="py-16 text-center text-muted">Matching…</p>
              ) : results.items.length ? (
                <>
                  {results.widened && (
                    <p className="mb-6 rounded-xl bg-tint p-4 text-sm text-navy-700">
                      Nothing matched that exactly, so here are the closest{" "}
                      <strong>{propertyTypes.find((t) => t.slug === answers.propertyType)?.label}</strong>{" "}
                      options we have. Tell us your requirement below and we'll go looking.
                    </p>
                  )}

                  <p className="mb-5 text-sm font-bold text-navy-700">
                    {results.total} {results.total === 1 ? "match" : "matches"}
                    {results.total > results.items.length && ` — showing the first ${results.items.length}`}
                  </p>

                  <div className="mb-8 grid gap-6 sm:grid-cols-2">
                    {results.items.map((property) => (
                      <PropertyCard key={property.slug} property={property} />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (answers.listingType) params.set("listingType", answers.listingType);
                      if (answers.propertyType) params.set("propertyType", answers.propertyType);
                      if (answers.city) params.set("city", answers.city);
                      if (answers.bedrooms) params.set("bedrooms", answers.bedrooms);
                      if (answers.budget?.min) params.set("minPrice", answers.budget.min);
                      if (answers.budget?.max) params.set("maxPrice", answers.budget.max);
                      navigate(`/properties?${params.toString()}`);
                    }}
                    className="btn-outline mb-10 w-full"
                  >
                    Open these in full search
                    <ArrowRight size={18} />
                  </button>
                </>
              ) : (
                // A dead end is the moment someone is most likely to leave, so the
                // fallback is a person to talk to — the numbers, not another link.
                <div className="card mb-10 p-8 text-center sm:p-12">
                  <p className="mb-2 text-lg font-extrabold text-navy-700">
                    Nothing on the site matches that yet
                  </p>
                  <p className="mx-auto mb-7 max-w-md text-sm text-muted">
                    A good part of our inventory never gets listed publicly. Call or WhatsApp us
                    with this brief and we'll search on your behalf.
                  </p>

                  <div className="mx-auto mb-6 grid max-w-lg gap-3 sm:grid-cols-2">
                    <a
                      href={`tel:${brand.phones[0].replace(/\s/g, "")}`}
                      onClick={() => track("matchmaker_empty_call")}
                      className="btn-brand w-full flex-col gap-1 py-4"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold tracking-wide uppercase opacity-90">
                        <Phone size={16} /> Call
                      </span>
                      <span className="text-base font-extrabold">{brand.phones[0]}</span>
                    </a>

                    <a
                      href={whatsappHref(whatsappText())}
                      target="_blank"
                      rel="noreferrer noopener"
                      onClick={() => track("matchmaker_empty_whatsapp")}
                      className="btn w-full flex-col gap-1 bg-chat py-4 text-white hover:brightness-95"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold tracking-wide uppercase opacity-90">
                        <WhatsApp size={16} /> WhatsApp
                      </span>
                      <span className="text-base font-extrabold">{whatsappNumber}</span>
                    </a>
                  </div>

                  <Link
                    to="/properties"
                    className="text-sm font-bold text-brand-500 hover:underline"
                  >
                    Browse everything instead
                  </Link>
                </div>
              )}

              {/* Lead capture sits AFTER results — never gates them. */}
              <div className="rounded-2xl bg-navy-900 p-8">
                {lead.sent ? (
                  <div className="text-center">
                    <p className="mb-2 text-xl font-extrabold text-white">Sent</p>
                    <p className="mb-5 text-sm text-white/70">
                      We have your requirement. We'll come back with matching options shortly.
                    </p>
                    <a
                      href={whatsappHref(whatsappText())}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="btn bg-chat text-white hover:brightness-95"
                    >
                      <WhatsApp size={18} /> Continue on WhatsApp
                    </a>
                  </div>
                ) : (
                  <form onSubmit={sendLead}>
                    <h3 className="mb-1.5 text-xl font-extrabold text-white">
                      Want these sent to your WhatsApp?
                    </h3>
                    <p className="mb-5 text-sm text-white/70">
                      We'll also flag new listings that match this brief as they come in.
                    </p>

                    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                      <input
                        className="field"
                        placeholder="Your name"
                        value={lead.name}
                        onChange={(event) => setLead((prev) => ({ ...prev, name: event.target.value }))}
                        aria-label="Your name"
                      />
                      <input
                        className="field"
                        placeholder="Phone number"
                        type="tel"
                        value={lead.phone}
                        onChange={(event) => setLead((prev) => ({ ...prev, phone: event.target.value }))}
                        aria-label="Phone number"
                      />
                      <button type="submit" className="btn-brand shrink-0">
                        Send to me
                      </button>
                    </div>

                    {lead.error && (
                      <p role="alert" className="mt-3 text-sm font-bold text-brand-400">
                        {lead.error}
                      </p>
                    )}
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// Compact entry point used on the homepage.
export function MatchmakerTeaser() {
  return (
    <section className="bg-navy-900 py-16">
      <div className="container-page">
        <div className="rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-10 text-center sm:p-14">
          <p className="mb-3 text-sm font-extrabold tracking-widest text-white/70 uppercase">
            Not sure where to start?
          </p>
          <h2 className="mx-auto mb-4 max-w-2xl text-3xl leading-tight font-extrabold text-white sm:text-4xl">
            Answer five questions. We'll shortlist what actually fits.
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-white/80">
            No sign-up, no email wall — you see the matches first, and decide afterwards whether you
            want them on WhatsApp.
          </p>
          <Link to="/find-my-property" className="btn bg-white text-brand-500 hover:bg-brand-50">
            <Search size={18} />
            Find my property
          </Link>
        </div>
      </div>
    </section>
  );
}
