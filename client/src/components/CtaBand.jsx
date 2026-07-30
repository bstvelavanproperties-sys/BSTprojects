import { Link } from "react-router-dom";
import brand from "../config/brand.js";
import { ArrowRight } from "./Icons.jsx";

// 10. CTA band
export default function CtaBand() {
  const cards = [
    {
      title: `Buy with ${brand.shortName}`,
      copy: "Find your perfect property with our expert guidance and an extensive, verified inventory.",
      cta: { label: "Buy a Property", href: "/buy" },
    },
    {
      title: `Rent with ${brand.shortName}`,
      copy: "Discover hassle-free rental solutions tailored to exactly what you need.",
      cta: { label: "Rent a Property", href: "/rent" },
    },
  ];

  return (
    <section className="bg-navy-900 py-16">
      <div className="container-page">
        <p className="mb-8 text-center text-lg font-extrabold text-gold-500">{brand.slogans.find}</p>
        <div className="grid gap-6 lg:grid-cols-2">
          {cards.map((card) => (
            <div key={card.title} className="rounded-2xl bg-tint p-8">
              <h3 className="mb-3 text-2xl font-extrabold text-navy-700">{card.title}</h3>
              <p className="mb-6 text-sm leading-relaxed text-muted">{card.copy}</p>
              <Link to={card.cta.href} className="btn-brand">
                {card.cta.label}
                <ArrowRight size={18} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
