import brand from "../config/brand.js";
import EnquiryForm from "../components/EnquiryForm.jsx";
import PageHero from "../components/PageHero.jsx";
import { usePageMeta } from "../lib/usePageMeta.js";
import { track } from "../lib/storage.js";
import { whatsappHref, whatsappNumber } from "../lib/whatsapp.js";
import { Mail, MapPin, Phone, WhatsApp } from "../components/Icons.jsx";

export default function Contact() {
  usePageMeta({
    title: `Contact Us — ${brand.name}`,
    description: `Call ${brand.phones[0]} or send an enquiry. ${brand.slogans.find}`,
  });

  const phone = brand.phones[0];
  const whatsappMessage = `Hi ${brand.name}, I'd like to talk about a property.`;

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

          <div className="space-y-6">
            {/* Calling and WhatsApp reach us faster than the form, so they lead the column. */}
            <div className="card p-7">
              <h3 className="mb-1 text-xl font-extrabold text-navy-700">Talk to us now</h3>
              <p className="mb-5 text-sm text-muted">
                The quickest way to reach us — call or message and we&apos;ll answer.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  onClick={() => track("contact_call")}
                  className="btn-brand w-full flex-col gap-1 py-4"
                >
                  <span className="flex items-center gap-2 text-xs font-bold tracking-wide uppercase opacity-90">
                    <Phone size={16} /> Call
                  </span>
                  <span className="text-base font-extrabold">{phone}</span>
                </a>

                <a
                  href={whatsappHref(whatsappMessage)}
                  target="_blank"
                  rel="noreferrer noopener"
                  onClick={() => track("contact_whatsapp")}
                  className="btn w-full flex-col gap-1 bg-chat py-4 text-white hover:brightness-95"
                >
                  <span className="flex items-center gap-2 text-xs font-bold tracking-wide uppercase opacity-90">
                    <WhatsApp size={16} /> WhatsApp
                  </span>
                  <span className="text-base font-extrabold">{whatsappNumber}</span>
                </a>
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
        </div>
      </section>
    </>
  );
}
