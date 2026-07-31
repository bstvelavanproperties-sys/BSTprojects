import { Link } from "react-router-dom";
import brand, { trustPoints } from "../config/brand.js";
import PageHero from "../components/PageHero.jsx";
import { pageMetaFor } from "@bstv/shared/pageMeta.js";
import { usePageMeta } from "../lib/usePageMeta.js";
import { iconMap } from "../components/iconMaps.js";

export default function About() {
  usePageMeta(pageMetaFor("/about"));

  return (
    <>
      <PageHero title="About Us" subtitle={brand.tagline} />

      <section className="py-16">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="h-section mb-5 text-left">{brand.promise}</h2>
            <div className="space-y-4 leading-relaxed text-muted">
              <p>
                {brand.name} works across property management, buying and selling. We take on the
                parts of a property transaction that most people dread — the verification, the
                paperwork, the follow-ups — and handle them properly.
              </p>
              <p>
                Every listing we publish is checked before it goes live. We would rather show you
                five genuine properties than fifty that waste your afternoon.
              </p>
              <p className="font-bold text-navy-700">{brand.slogans.manage}</p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/properties" className="btn-brand">
                Browse properties
              </Link>
              <Link to="/contact" className="btn-outline">
                Talk to us
              </Link>
            </div>
          </div>

          <img
            src="/assets/platform.svg"
            alt=""
            className="w-full rounded-3xl"
            loading="lazy"
          />
        </div>
      </section>

      <section className="bg-tint py-16">
        <div className="container-page grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((point) => {
            const Icon = iconMap[point.icon];
            return (
              <div key={point.title} className="text-center">
                <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white">
                  <Icon size={26} />
                </span>
                <h3 className="mb-1.5 text-lg font-extrabold text-navy-700">{point.title}</h3>
                <p className="text-sm text-muted">{point.copy}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
