import { useState } from "react";
import { useCompare } from "../context/compareContext.js";

// The toggle that lives on each property card.
export default function CompareToggle({ slug, className = "" }) {
  const { has, toggle, max } = useCompare();
  const [full, setFull] = useState(false);
  const selected = has(slug);

  const onClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const ok = toggle(slug);
    if (!ok) {
      setFull(true);
      setTimeout(() => setFull(false), 2200);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={full ? `You can compare up to ${max}` : "Add to comparison"}
      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold transition-colors ${
        selected
          ? "bg-brand-500 text-white"
          : full
            ? "bg-navy-700 text-white"
            : "bg-white/90 text-navy-700 hover:bg-white"
      } ${className}`}
    >
      {full ? `Max ${max}` : selected ? "✓ Comparing" : "Compare"}
    </button>
  );
}
