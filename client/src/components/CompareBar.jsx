import { useCompare } from "../context/compareContext.js";
import { track } from "../lib/storage.js";

// Docked bar — appears as soon as something is selected.
export default function CompareBar() {
  const { slugs, clear, setOpen, max } = useCompare();
  if (!slugs.length) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-navy-900/95 backdrop-blur">
      <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
        <p className="text-sm font-bold text-white">
          {slugs.length} of {max} selected to compare
        </p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={clear} className="px-3 text-sm font-bold text-white/60 hover:text-white">
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              track("compare_open", { count: slugs.length });
            }}
            disabled={slugs.length < 2}
            className="btn-brand py-2.5 disabled:opacity-45"
          >
            {slugs.length < 2 ? "Pick one more" : "Compare now"}
          </button>
        </div>
      </div>
    </div>
  );
}
