import brand from "../config/brand.js";
import EnquiryForm from "../components/EnquiryForm.jsx";
import PageHero from "../components/PageHero.jsx";
import { usePageMeta } from "../lib/usePageMeta.js";
import { Mail, MapPin, Phone } from "../components/Icons.jsx";

export default function Contact() {
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

              {Object.values(brand.offices).map((office) => (
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
