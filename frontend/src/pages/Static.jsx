import { Link } from "react-router-dom";
import brand, { platformCards, services, trustPoints } from "../data/brand.js";
import EnquiryForm from "../components/EnquiryForm.jsx";
import { SectionHeading } from "../components/Sections.jsx";
import { usePageMeta } from "../lib/usePageMeta.js";
import { iconMap, Mail, MapPin, Phone } from "../components/Icons.jsx";

const PageHero = ({ title, subtitle }) => (
  <section className="bg-navy-900 py-14">
    <div className="container-page text-center">
      <h1 className="mb-2 text-4xl font-extrabold text-white sm:text-5xl">{title}</h1>
      {subtitle && <p className="mx-auto max-w-2xl text-white/70">{subtitle}</p>}
    </div>
  </section>
);

// ---------------------------------------------------------------------------
export function Services() {
  usePageMeta({
    title: `Our Services — ${brand.name}`,
    description: `${brand.slogans.manage} Property management, rental management, maintenance and documentation support.`,
  });

  return (
    <>
      <PageHero title="Our Services" subtitle={brand.slogans.manage} />

      <section className="py-16">
        <div className="container-page grid gap-6 sm:grid-cols-2">
          {services.map((service) => {
            const Icon = iconMap[service.icon];
            return (
              <article key={service.slug} className="card flex gap-5 p-7">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white">
                  <Icon size={26} />
                </span>
                <div>
                  <h2 className="mb-2 text-xl font-extrabold text-navy-700">{service.title}</h2>
                  <p className="text-sm leading-relaxed text-muted">{service.copy}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-tint py-16">
        <div className="container-page">
          <SectionHeading title="Buying, selling or renting" />
          <div className="grid gap-6 lg:grid-cols-3">
            {platformCards.map((card) => (
              <article key={card.key} className="card p-7">
                <h3 className="mb-2 text-xl font-extrabold text-navy-700">{card.title}</h3>
                <p className="mb-5 text-sm leading-relaxed text-muted">{card.copy}</p>
                <ul className="mb-6 space-y-2">
                  {card.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-navy-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link to={card.cta.href} className="btn-brand w-full">
                  {card.cta.label}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
export function About() {
  usePageMeta({
    title: `About Us — ${brand.name}`,
    description: `${brand.promise} Learn how ${brand.name} works with buyers, sellers and property owners.`,
  });

  return (
    <>
      <PageHero title="About Us" subtitle={brand.tagline} />

      <section className="py-16">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="h-section mb-5 text-left">{brand.promise}</h2>
            <div className="space-y-4 leading-relaxed text-muted">
              <p>
                {brand.name} works across property management, buying and selling. We take on the
                parts of a property transaction that most people dread — the verification, the
                paperwork, the follow-ups — and handle them properly.
              </p>
              <p>
                Every listing we publish is checked before it goes live. We would rather show you
                five genuine properties than fifty that waste your afternoon.
              </p>
              <p className="font-bold text-navy-700">{brand.slogans.manage}</p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/properties" className="btn-brand">
                Browse properties
              </Link>
              <Link to="/contact" className="btn-outline">
                Talk to us
              </Link>
            </div>
          </div>

          <img
            src="/assets/platform.svg"
            alt=""
            className="w-full rounded-3xl"
            loading="lazy"
          />
        </div>
      </section>

      <section className="bg-tint py-16">
        <div className="container-page grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((point) => {
            const Icon = iconMap[point.icon];
            return (
              <div key={point.title} className="text-center">
                <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white">
                  <Icon size={26} />
                </span>
                <h3 className="mb-1.5 text-lg font-extrabold text-navy-700">{point.title}</h3>
                <p className="text-sm text-muted">{point.copy}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
export function Contact() {
  usePageMeta({
    title: `Contact Us — ${brand.name}`,
    description: `Call ${brand.phones[0]} or send an enquiry. ${brand.slogans.find}`,
  });

  return (
    <>
      <PageHero title="Contact Us" subtitle={brand.slogans.find} />

      <section className="py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="mb-6 text-2xl font-extrabold text-navy-700">Get in touch</h2>

            <div className="space-y-5">
              <div className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                  <Phone size={20} />
                </span>
                <div>
                  <p className="mb-1 text-sm font-bold text-navy-700">Phone</p>
                  {brand.phones.map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone.replace(/\s/g, "")}`}
                      className="block text-sm text-muted hover:text-brand-500"
                    >
                      {phone}
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                  <Mail size={20} />
                </span>
                <div>
                  <p className="mb-1 text-sm font-bold text-navy-700">Email</p>
                  {brand.emails.map((email) => (
                    <a
                      key={email}
                      href={`mailto:${email}`}
                      className="block text-sm break-all text-muted hover:text-brand-500"
                    >
                      {email}
                    </a>
                  ))}
                </div>
              </div>

              {[brand.offices.head, brand.offices.branch].map((office) => (
                <div key={office.label} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                    <MapPin size={20} />
                  </span>
                  <div>
                    <p className="mb-1 text-sm font-bold text-navy-700">{office.label}</p>
                    {office.lines.map((line) => (
                      <p key={line} className="text-sm text-muted">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <EnquiryForm
            type="callback"
            title="Send us a message"
            subtitle="Tell us what you're looking for and we'll call you back."
            extraFields={[
              {
                name: "preferredTime",
                placeholder: "Best time to call",
                options: ["Morning", "Afternoon", "Evening", "Weekend"],
              },
            ]}
          />
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
export function PropertyWanted() {
  usePageMeta({
    title: `Property Wanted — ${brand.name}`,
    description: "Tell us what you're looking for and we'll find it for you.",
  });

  return (
    <>
      <PageHero
        title="Property Wanted"
        subtitle="Can't find it on the site? Tell us what you need and we'll go looking."
      />

      <section className="py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="mb-4 text-2xl font-extrabold text-navy-700">
              We'll search on your behalf
            </h2>
            <p className="mb-6 leading-relaxed text-muted">
              A good part of our inventory never reaches the website — owners often prefer a quiet
              sale. Tell us your requirement and budget, and we'll match it against what we know is
              available.
            </p>
            <ul className="space-y-3">
              {[
                "Verified owners only, no brokers in the chain",
                "We check the title before we show you anything",
                "Honest guidance on what your budget realistically buys",
                "No charge for the search",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-navy-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <EnquiryForm
            type="property-wanted"
            title="What are you looking for?"
            subtitle="The more detail you give us, the better the match."
            extraFields={[
              { name: "budget", placeholder: "Budget (e.g. ₹80 L – ₹1.2 Cr)" },
              {
                name: "preferredTime",
                placeholder: "Best time to call",
                options: ["Morning", "Afternoon", "Evening", "Weekend"],
              },
            ]}
          />
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
const faqs = [
  {
    q: "Do you charge a fee for helping me find a property?",
    a: "No. Our search service is free for buyers and tenants. We're paid by the owner on a completed transaction, and we'll always tell you upfront where our commission sits.",
  },
  {
    q: "Are the listings on this site verified?",
    a: "Yes. Every listing is checked before it goes live — we confirm ownership, look at the title documents and visit the property. Anything we can't verify doesn't get published.",
  },
  {
    q: "What documents should I check before buying?",
    a: "At minimum: the parent document and sale deed, an encumbrance certificate covering at least 15 years, patta or chitta for land, approved layout plans, and the latest tax receipts. Our documentation team walks you through all of it.",
  },
  {
    q: "Can you manage a property I own but don't live near?",
    a: "That's exactly what our property management service is for. We handle tenants, rent collection, maintenance and periodic inspections, and send you a regular report.",
  },
  {
    q: "How long does a typical sale take to close?",
    a: "For a clean title with a ready buyer, six to eight weeks is realistic. Loan approvals and any title corrections are usually what extends it.",
  },
  {
    q: "Do you help with home loans?",
    a: "We don't lend, but we work with several banks and can introduce you to a manager who handles property loans. The EMI calculator on each listing gives you a rough starting point.",
  },
];

export function Faqs() {
  usePageMeta({
    title: `FAQs — ${brand.name}`,
    description: "Common questions about buying, selling, renting and property management.",
  });

  return (
    <>
      <PageHero title="Frequently Asked Questions" />

      <section className="py-16">
        <div className="container-page max-w-3xl">
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="card group p-6 [&_summary::-webkit-details-marker]:hidden">
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

          <div className="mt-10 rounded-2xl bg-tint p-8 text-center">
            <p className="mb-4 font-bold text-navy-700">Still have a question?</p>
            <Link to="/contact" className="btn-brand">
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
export function NotFound() {
  usePageMeta({ title: `Page not found — ${brand.name}` });

  return (
    <div className="container-page py-28 text-center">
      <p className="mb-3 text-6xl font-extrabold text-brand-500">404</p>
      <h1 className="mb-3 text-3xl font-extrabold text-navy-700">Page not found</h1>
      <p className="mb-8 text-muted">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn-brand">
        Back to home
      </Link>
    </div>
  );
}
