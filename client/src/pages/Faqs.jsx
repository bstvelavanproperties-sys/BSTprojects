import { Link } from "react-router-dom";
import { faqs } from "@bstv/shared/faqs.js";
import { pageMetaFor } from "@bstv/shared/pageMeta.js";
import PageHero from "../components/PageHero.jsx";
import { usePageMeta } from "../lib/usePageMeta.js";

export default function Faqs() {
  // The questions below are also emitted as FAQPage structured data by shared/pageMeta.js.
  // Both read the same array, which is what keeps the markup matching the visible page.
  usePageMeta(pageMetaFor("/faqs"));

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
