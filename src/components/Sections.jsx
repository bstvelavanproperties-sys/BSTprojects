import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import brand, { platformCards, services, trustPoints, typeLabel } from "../data/brand.js";
import { fetchPropertyTypes, fetchReviews } from "../lib/api.js";
import {
  iconMap,
  propertyTypeIcons,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
  Star,
} from "./Icons.jsx";

export const SectionHeading = ({ title, subtitle, className = "" }) => (
  <div className={`mb-10 text-center ${className}`}>
    <h2 className="h-section">{title}</h2>
    {subtitle && <p className="mt-3 text-base text-muted">{subtitle}</p>}
  </div>
);

// ---------------------------------------------------------------------------
// 3. Trust strip — from the brand flyer.
// ---------------------------------------------------------------------------
export function TrustStrip() {
  return (
    <section className="bg-tint py-14">
      <div className="container-page grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {trustPoints.map((point) => {
          const Icon = iconMap[point.icon];
          return (
            <div key={point.title} className="flex flex-col items-center px-4 text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white">
                <Icon size={26} />
              </span>
              <h3 className="mb-1.5 text-lg font-extrabold text-navy-700">{point.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{point.copy}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 4. Property-type carousel with live counts.
// ---------------------------------------------------------------------------
export function CategoryCarousel() {
  const [types, setTypes] = useState([]);
  const scroller = useRef(null);

  useEffect(() => {
    fetchPropertyTypes()
      .then(setTypes)
      .catch(() => setTypes([]));
  }, []);

  const scrollBy = (direction) => {
    const node = scroller.current;
    if (!node) return;
    node.scrollBy({ left: direction * (node.clientWidth * 0.8), behavior: "smooth" });
  };

  if (!types.length) return null;

  return (
    <section className="bg-tint py-20">
      <div className="container-page">
        <SectionHeading title="Let's Explore The Different Types Of Properties" />

        <div className="relative">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Previous property types"
            className="absolute -left-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transition-colors hover:bg-brand-600 lg:flex"
          >
            <ChevronLeft size={22} />
          </button>

          <ul
            ref={scroller}
            className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2"
          >
            {types.map((type) => {
              const Icon = propertyTypeIcons[type.slug] || iconMap.building;
              return (
                <li
                  key={type.slug}
                  className="w-[calc(50%-10px)] shrink-0 snap-start sm:w-[calc(33.333%-14px)] lg:w-[calc(20%-16px)]"
                >
                  <Link
                    to={`/properties?propertyType=${type.slug}`}
                    className="card flex h-full flex-col items-center justify-center px-4 py-9 text-center transition-transform hover:-translate-y-1"
                  >
                    <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
                      <Icon size={30} />
                    </span>
                    <h3 className="mb-1 text-base font-extrabold text-navy-700">
                      {typeLabel(type.slug)}
                    </h3>
                    <p className="text-sm text-muted">
                      {type.count} {type.count === 1 ? "Property" : "Properties"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Next property types"
            className="absolute -right-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-navy-700 shadow-lg transition-colors hover:bg-brand-50 lg:flex"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 6. "We Provide The Best Platform"
// ---------------------------------------------------------------------------
export function PlatformSection() {
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

// ---------------------------------------------------------------------------
// 7. Services — from the flyer. Not on the reference site.
// ---------------------------------------------------------------------------
export function ServicesSection() {
  return (
    <section className="py-20">
      <div className="container-page">
        <SectionHeading title="Our Services" subtitle={brand.slogans.manage} />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => {
            const Icon = iconMap[service.icon];
            return (
              <article key={service.slug} className="card p-7 text-center">
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

// ---------------------------------------------------------------------------
// 9. Testimonials
// ---------------------------------------------------------------------------
export function TestimonialsSection() {
  const [reviews, setReviews] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetchReviews()
      .then(setReviews)
      .catch(() => setReviews([]));
  }, []);

  if (!reviews.length) return null;

  const review = reviews[index];
  const move = (step) => setIndex((current) => (current + step + reviews.length) % reviews.length);

  // Derived from the reviews actually present — never a fabricated total.
  const average = reviews.reduce((sum, item) => sum + (item.rating || 0), 0) / reviews.length;
  const ratingWord = average >= 4.5 ? "EXCELLENT" : average >= 3.5 ? "GREAT" : "GOOD";

  return (
    <section className="bg-surface py-20">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="h-section mb-4 text-left">Voices of Our Valued Clients</h2>
          <p className="mb-8 max-w-lg text-base leading-relaxed text-muted">
            Read the stories of clients who have found success with {brand.name}, and the care we put
            into every transaction.
          </p>

          <div className="card p-7">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-lg font-extrabold text-navy-700">{ratingWord} rating</p>
                <p className="text-sm text-muted">
                  {average.toFixed(1)} average from {reviews.length}{" "}
                  {reviews.length === 1 ? "review" : "reviews"}
                </p>
              </div>
              <div
                className="flex gap-0.5 text-gold-500"
                aria-label={`${review.rating} out of 5 stars`}
              >
                {Array.from({ length: 5 }, (_, star) => (
                  <Star
                    key={star}
                    size={20}
                    className={star < review.rating ? "" : "text-gray-200"}
                  />
                ))}
              </div>
            </div>

            <blockquote className="min-h-28 text-[15px] leading-relaxed text-muted">
              “{review.text}”
            </blockquote>

            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-extrabold text-white">
                  {review.name.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-extrabold text-navy-700">{review.name}</p>
                  <p className="text-xs text-muted">{review.when}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => move(-1)}
                  aria-label="Previous review"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-navy-700 hover:border-brand-500 hover:text-brand-500"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => move(1)}
                  aria-label="Next review"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-navy-700 hover:border-brand-500 hover:text-brand-500"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-8">
          <img
            src="/assets/keys.svg"
            alt=""
            className="w-full max-w-md"
            loading="lazy"
          />
          <Link to="/properties" className="btn-brand">
            <Search size={18} />
            Find your wonderful home
          </Link>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 10. CTA band
// ---------------------------------------------------------------------------
export function CtaBand() {
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
