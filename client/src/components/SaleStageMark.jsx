import { saleStage, stageLabel } from "@bstv/shared/saleStage.js";

// The visible result of a closed sale, in two flavours of the same story:
//
//   processing — the deal is agreed but not done. Gold, quiet, informative.
//   closed     — final. Loud, stamped across the photograph.
//
// Both read their stage from shared/saleStage.js, so a card and a property page can
// never disagree about which one a listing is in.
export default function SaleStageMark({ property, variant = "card" }) {
  const stage = saleStage(property);
  if (stage === "available") return null;

  const label = stageLabel(property);

  if (variant === "banner") {
    return stage === "processing" ? (
      <p className="mb-4 flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-3 text-sm font-extrabold text-navy-900">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-navy-900" />
        {label} — this property is under offer and no longer taking new enquiries.
      </p>
    ) : (
      <p className="mb-4 rounded-xl bg-navy-900 px-4 py-4 text-center text-3xl font-extrabold tracking-[0.2em] text-white sm:text-4xl">
        {label}
      </p>
    );
  }

  // Card overlay, drawn over the photograph.
  //
  // Sits along the TOP edge, not the bottom: the price chip is pulled up over the
  // image's bottom edge by -mt-7, and a band down there loses its middle behind it.
  // PropertyCard drops the label chips below this band when it is showing.
  if (stage === "processing") {
    return (
      <span className="absolute inset-x-0 top-0 bg-gold-500 py-1.5 text-center text-[11px] font-extrabold tracking-widest text-navy-900 uppercase">
        {label}
      </span>
    );
  }

  return (
    <span className="absolute inset-0 flex items-center justify-center bg-navy-900/55">
      <span className="-rotate-6 border-[3px] border-white px-5 py-1.5 text-2xl font-extrabold tracking-[0.18em] text-white">
        {label}
      </span>
    </span>
  );
}
