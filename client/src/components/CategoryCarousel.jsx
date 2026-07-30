import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { typeLabel } from "../config/brand.js";
import { fetchPropertyTypes } from "../lib/api.js";
import SectionHeading from "./SectionHeading.jsx";
import { iconMap, propertyTypeIcons } from "./iconMaps.js";
import { ChevronLeft, ChevronRight } from "./Icons.jsx";

// 4. Property-type carousel with live counts.
export default function CategoryCarousel() {
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
