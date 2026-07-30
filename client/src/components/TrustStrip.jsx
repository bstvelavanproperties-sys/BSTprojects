import { trustPoints } from "../config/brand.js";
import { iconMap } from "./iconMaps.js";

// 3. Trust strip — from the brand flyer.
export default function TrustStrip() {
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
