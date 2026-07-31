import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import brand, { propertyTypes, typeLabel } from "../config/brand.js";
import { fetchContent, fetchProperties } from "../lib/api.js";
import PropertyCard, { PropertyCardSkeleton } from "../components/PropertyCard.jsx";
import HeroBackdrop from "../components/HeroBackdrop.jsx";
import HeroSearch from "../components/HeroSearch.jsx";
import CategoryCarousel from "../components/CategoryCarousel.jsx";
import CtaBand from "../components/CtaBand.jsx";
import NriPopup from "../components/NriPopup.jsx";
import PlatformSection from "../components/PlatformSection.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import ServicesSection from "../components/ServicesSection.jsx";
import TestimonialsSection from "../components/TestimonialsSection.jsx";
import TrustStrip from "../components/TrustStrip.jsx";
import { MatchmakerTeaser } from "./Matchmaker.jsx";
import { pageMetaFor } from "@bstv/shared/pageMeta.js";
import { usePageMeta } from "../lib/usePageMeta.js";
import { useReveal, revealDelay } from "../lib/useReveal.js";

function FeaturedProperties({ content }) {
  const [activeType, setActiveType] = useState("");
  const [state, setState] = useState({ items: [], loading: true });
  const reveal = useReveal([state.items]);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    fetchProperties({ listingType: "sale", propertyType: activeType, limit: 8, featured: "true" })
      .then((data) => {
        if (cancelled) return;
        // Fall back to any sale listing if nothing is flagged featured for this type.
        if (!data.items.length) {
          return fetchProperties({ listingType: "sale", propertyType: activeType, limit: 8 }).then(
            (all) => !cancelled && setState({ items: all.items, loading: false }),
          );
        }
        setState({ items: data.items, loading: false });
      })
      .catch(() => !cancelled && setState({ items: [], loading: false }));

    return () => {
      cancelled = true;
    };
  }, [activeType]);

  return (
    <section className="py-20">
      <div className="container-page" ref={reveal}>
        <SectionHeading
          title={content.featuredTitle || "Featured Property"}
          subtitle={content.featuredSubtitle || "Find a property that's right for you."}
        />

        <div className="no-scrollbar mb-9 flex justify-start gap-3 overflow-x-auto pb-1 lg:justify-center">
          <button
            type="button"
            onClick={() => setActiveType("")}
            className={`pill shrink-0 ${activeType === "" ? "pill-active" : ""}`}
          >
            All
          </button>
          {propertyTypes.map((type) => (
            <button
              key={type.slug}
              type="button"
              onClick={() => setActiveType(type.slug)}
              className={`pill shrink-0 ${activeType === type.slug ? "pill-active" : ""}`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {state.loading
            ? Array.from({ length: 8 }, (_, index) => <PropertyCardSkeleton key={index} />)
            : state.items.map((property, index) => (
                <div key={property.slug} className="reveal" style={revealDelay(index)}>
                  <PropertyCard property={property} />
                </div>
              ))}
        </div>

        {!state.loading && !state.items.length && (
          <p className="py-12 text-center text-muted">
            No {activeType ? typeLabel(activeType).toLowerCase() : ""} listings just yet — check back
            soon.
          </p>
        )}

        <div className="mt-12 text-center">
          <Link to="/properties?listingType=sale" className="btn-brand">
            View All Properties
          </Link>
        </div>
      </div>
    </section>
  );
}

function RentalProperties({ content }) {
  const [state, setState] = useState({ items: [], loading: true });

  useEffect(() => {
    fetchProperties({ listingType: "rent", limit: 4 })
      .then((data) => setState({ items: data.items, loading: false }))
      .catch(() => setState({ items: [], loading: false }));
  }, []);

  if (!state.loading && !state.items.length) return null;

  return (
    <section className="py-20">
      <div className="container-page">
        <SectionHeading title={content.rentalTitle || "Discover Rental Properties"} />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {state.loading
            ? Array.from({ length: 4 }, (_, index) => <PropertyCardSkeleton key={index} />)
            : state.items.map((property) => (
                <PropertyCard key={property.slug} property={property} />
              ))}
        </div>

        <div className="mt-12 text-center">
          <Link to="/properties?listingType=rent" className="btn-brand">
            View All Rental Properties
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [content, setContent] = useState({});

  usePageMeta(pageMetaFor("/"));

  useEffect(() => {
    fetchContent()
      .then(setContent)
      .catch(() => setContent({}));
  }, []);

  const heroImage =
    content.heroImage && content.heroImage !== "/assets/hero.svg"
      ? content.heroImage
      : "/assets/hero-real-estate.jpg";

  return (
    <>
      {/* Home only, so it stays out of Layout.jsx with the site-wide floating widgets.
          `content` is already in hand from the fetch above — no second request. */}
      <NriPopup content={content} />

      {/* 2. Hero */}
      <section className="relative isolate overflow-hidden">
        <HeroBackdrop image={heroImage} />

        <div className="container-page relative z-10 py-24 lg:py-32">
          <div className="mx-auto mb-10 max-w-4xl text-center">
            <h1 className="h-hero mb-6 text-white">{content.heroHeadline || brand.headline}</h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
              {content.heroSubline || brand.subline} {brand.promise}
            </p>
          </div>

          <HeroSearch />

          <div className="mx-auto mt-10 max-w-4xl">
            <p className="mb-4 text-sm font-bold text-white/85">Or browse featured categories:</p>
            <ul className="flex flex-wrap gap-3">
              {propertyTypes.map((type) => (
                <li key={type.slug}>
                  <Link
                    to={`/properties?propertyType=${type.slug}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                  >
                    {type.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <TrustStrip />
      <CategoryCarousel />
      <FeaturedProperties content={content} />
      <MatchmakerTeaser />
      <PlatformSection />
      <ServicesSection />
      <RentalProperties content={content} />
      <TestimonialsSection />
      <CtaBand />
    </>
  );
}
