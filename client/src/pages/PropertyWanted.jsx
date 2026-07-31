import EnquiryForm from "../components/EnquiryForm.jsx";
import PageHero from "../components/PageHero.jsx";
import { pageMetaFor } from "@bstv/shared/pageMeta.js";
import { usePageMeta } from "../lib/usePageMeta.js";

export default function PropertyWanted() {
  usePageMeta(pageMetaFor("/property-wanted"));

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
