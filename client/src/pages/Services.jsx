import { Link } from "react-router-dom";
import brand, { platformCards, services } from "../config/brand.js";
import PageHero from "../components/PageHero.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import { usePageMeta } from "../lib/usePageMeta.js";
import { iconMap } from "../components/iconMaps.js";

export default function Services() {
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
