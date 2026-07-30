import { Link } from "react-router-dom";
import { platformCards } from "../config/brand.js";
import { iconMap } from "./iconMaps.js";
import { ArrowRight } from "./Icons.jsx";

// 6. "We Provide The Best Platform"
export default function PlatformSection() {
  return (
    <section className="bg-tint py-20">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="h-section mb-3 text-left">We Provide The Best Platform</h2>
          <p className="mb-8 text-base text-muted">
            Our job is to make sure you get the best possible deal on the property.
          </p>

          <div className="space-y-4">
            {platformCards.map((card) => {
              const Icon = iconMap[card.icon];
              return (
                <div key={card.key} className="card flex gap-4 p-6">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                    <Icon size={24} />
                  </span>
                  <div>
                    <h3 className="mb-1 text-lg font-extrabold text-navy-700">{card.title}</h3>
                    <p className="mb-3 text-sm leading-relaxed text-muted">{card.copy}</p>
                    <Link
                      to={card.cta.href}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-500 hover:gap-2.5"
                    >
                      {card.cta.label}
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl">
          <img
            src="/assets/platform.svg"
            alt="A happy homeowner holding a picture frame in front of a new house"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
