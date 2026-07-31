import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { nriFaqs } from "@bstv/shared/faqs.js";
import { pageMetaFor } from "@bstv/shared/pageMeta.js";
import brand, { nriServices } from "../config/brand.js";
import { fetchProperties } from "../lib/api.js";
import { track } from "../lib/storage.js";
import { whatsappHref } from "../lib/whatsapp.js";
import CtaBand from "../components/CtaBand.jsx";
import EnquiryForm from "../components/EnquiryForm.jsx";
import PageHero from "../components/PageHero.jsx";
import PropertyCard, { PropertyCardSkeleton } from "../components/PropertyCard.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import { iconMap } from "../components/iconMaps.js";
import { Phone, WhatsApp } from "../components/Icons.jsx";
import { usePageMeta } from "../lib/usePageMeta.js";
import { useReveal, revealDelay } from "../lib/useReveal.js";

// Countries first, "Other" last — the list is a convenience, not a gate, and the free
// text fallback matters more than the list being exhaustive.
const COUNTRIES = [
  "United States",
  "United Arab Emirates",
  "United Kingdom",
  "Singapore",
  "Australia",
  "Canada",
  "Malaysia",
  "Qatar",
  "Saudi Arabia",
  "Other",
];

const BUDGETS = [
  "Under ₹50 L",
  "₹50 L – ₹1 Cr",
  "₹1 Cr – ₹2 Cr",
  "₹2 Cr – ₹5 Cr",
  "Above ₹5 Cr",
];

// IST windows, labelled with the offset, because the whole point is that the caller
// and the person picking are not in the same day.
const CALL_TIMES = [
  "Morning (IST 9am – 12pm)",
  "Afternoon (IST 12pm – 4pm)",
  "Evening (IST 4pm – 8pm)",
  "Late evening (IST 8pm – 10pm)",
  "Weekend",
];

function NriListings() {
  const [state, setState] = useState({ items: [], loading: true });
  const reveal = useReveal([state.items]);

  useEffect(() => {
    let cancelled = false;
    fetchProperties({ nriFriendly: "true", limit: 8 })
      .then((data) => !cancelled && setState({ items: data.items, loading: false }))
      .catch(() => !cancelled && setState({ items: [], loading: false }));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-tint py-20">
      <div className="container-page" ref={reveal}>
        <SectionHeading
          title="Properties suited to NRI buyers"
          subtitle="Clear title, cooperative sellers, and something we can manage for you afterwards."
        />

        {state.loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <PropertyCardSkeleton key={index} />
            ))}
          </div>
        ) : state.items.length ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {state.items.map((property, index) => (
                <div key={property.slug} className="reveal" style={revealDelay(index)}>
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                to="/properties?nriFriendly=true"
                onClick={() => track("nri_view_all_listings")}
                className="btn-brand"
              >
                View all NRI-friendly properties
              </Link>
            </div>
          </>
        ) : (
          // Same principle as the empty listings state: never a dead end, hand the
          // visitor a person instead of an apology.
          <div className="card mx-auto max-w-xl p-8 text-center sm:p-12">
            <p className="mb-2 text-lg font-extrabold text-navy-700">
              Nothing tagged just yet
            </p>
            <p className="mb-6 text-sm leading-relaxed text-muted">
              Much of what suits an overseas buyer never gets listed publicly. Tell us what
              you&apos;re after and we&apos;ll search on your behalf.
            </p>
            <Link to="/property-wanted" className="btn-brand">
              Tell us what you need
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default function Nri() {
  usePageMeta(pageMetaFor("/nri"));

  const message = `Hi ${brand.name}, I'm an NRI buyer and I'd like to know more about your services.`;

  return (
    <>
      <PageHero
        title="NRI Corner"
        subtitle="Buying or owning property in Tamil Nadu while you live abroad — handled end to end, so you don't have to book a flight to sign a document."
      />

      <section className="py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="mb-4 text-2xl font-extrabold text-navy-700">
              The distance is our problem, not yours
            </h2>
            <p className="mb-6 leading-relaxed text-muted">
              Buying from eight thousand kilometres away usually means trusting somebody
              you&apos;ve never met with the largest cheque you&apos;ll ever write. We work the
              way we&apos;d want someone to work for our own family: verify the title before you
              commit, show you the property honestly on video, and stay reachable in your
              evening rather than only in ours.
            </p>

            <ul className="mb-8 space-y-3">
              {[
                "Every title checked by our legal team before you're shown a price",
                "We call in your timezone, not ours",
                "One point of contact from the first enquiry to the handover",
                "Management, tenants and upkeep handled once you fly home",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-navy-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {point}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              <a
                href={`tel:${brand.phones[0].replace(/\s/g, "")}`}
                onClick={() => track("nri_call")}
                className="btn-outline"
              >
                <Phone size={18} /> {brand.phones[0]}
              </a>
              <a
                href={whatsappHref(message)}
                target="_blank"
                rel="noreferrer noopener"
                onClick={() => track("nri_whatsapp")}
                className="btn bg-chat text-white hover:brightness-95"
              >
                <WhatsApp size={18} /> WhatsApp
              </a>
            </div>
          </div>

          <EnquiryForm
            type="nri-enquiry"
            title="Buying from abroad? Let's talk."
            subtitle="Tell us where you're based and we'll call at a time that actually works for you."
            extraFields={[
              { name: "country", placeholder: "Country you're based in", options: COUNTRIES },
              { name: "budget", placeholder: "Budget", options: BUDGETS },
              { name: "preferredTime", placeholder: "Best time to call", options: CALL_TIMES },
            ]}
          />
        </div>
      </section>

      <section className="py-20">
        <div className="container-page">
          <SectionHeading
            title="What we handle for you"
            subtitle="From the first video walkthrough to the rent landing in your account."
          />

          <div className="flex flex-wrap justify-center gap-6">
            {nriServices.map((service) => {
              const Icon = iconMap[service.icon];
              return (
                <article
                  key={service.title}
                  className="card w-full p-7 text-center sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
                >
                  <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white">
                    <Icon size={26} />
                  </span>
                  <h3 className="mb-2 text-lg font-extrabold text-navy-700">{service.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{service.copy}</p>
                </article>
              );
            })}
          </div>

          {/* Said plainly rather than buried, for the same reason the loan service says
              we introduce and do not lend: promising tax or FEMA advice we are not
              licensed to give would be the easiest way to lose someone's trust. */}
          <p className="mx-auto mt-10 max-w-2xl rounded-xl bg-tint px-5 py-4 text-center text-sm leading-relaxed text-muted">
            We coordinate the paperwork and work alongside your chartered accountant and bank
            on anything involving remittance, repatriation or tax. We don&apos;t give financial
            or tax advice ourselves — we&apos;ll tell you honestly when you need your own
            adviser.
          </p>
        </div>
      </section>

      <NriListings />

      {/* Rendered from the same array shared/pageMeta.js turns into FAQPage structured data.
          The markup is only allowed to claim what a visitor can actually read here. */}
      <section className="py-20">
        <div className="container-page max-w-3xl">
          <SectionHeading title="NRI questions we're asked most" />

          <div className="space-y-3">
            {nriFaqs.map((faq) => (
              <details
                key={faq.q}
                className="card group p-6 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-lg font-extrabold text-navy-700">
                  {faq.q}
                  <span className="shrink-0 text-2xl text-brand-500 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-muted">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
