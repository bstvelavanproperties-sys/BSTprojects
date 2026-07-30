import { Link } from "react-router-dom";
import brand from "../config/brand.js";
import PageHero from "../components/PageHero.jsx";
import { usePageMeta } from "../lib/usePageMeta.js";

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

export default function Faqs() {
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
