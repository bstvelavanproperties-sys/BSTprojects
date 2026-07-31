import brand, { services } from "../config/brand.js";
import SectionHeading from "./SectionHeading.jsx";
import { iconMap } from "./iconMaps.js";

// 7. Services — from the flyer. Not on the reference site.
export default function ServicesSection() {
  return (
    <section className="py-20">
      <div className="container-page">
        <SectionHeading title="Our Services" subtitle={brand.slogans.manage} />

        {/* Wrapping flex rather than a grid so an odd trailing card centres itself. */}
        <div className="flex flex-wrap justify-center gap-6">
          {services.map((service) => {
            const Icon = iconMap[service.icon];
            return (
              <article
                key={service.slug}
                className="card w-full p-7 text-center sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)]"
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
      </div>
    </section>
  );
}
