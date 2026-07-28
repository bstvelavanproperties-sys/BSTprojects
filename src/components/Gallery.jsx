import { useCallback, useEffect, useRef, useState } from "react";
import { cloudinaryUrl } from "../lib/format.js";
import { ChevronLeft, ChevronRight, Close } from "./Icons.jsx";

export default function Gallery({ images = [], title }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);
  const previouslyFocused = useRef(null);

  const list = images.length ? images : ["/assets/properties/placeholder.svg"];

  const move = useCallback(
    (step) => setActive((current) => (current + step + list.length) % list.length),
    [list.length],
  );

  // Keyboard control + focus trapping while the lightbox is open.
  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;
    closeRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowRight") move(1);
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "Tab") {
        // Only the close button is focusable inside — keep focus on it.
        event.preventDefault();
        closeRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, move]);

  return (
    <>
      <div className="overflow-hidden rounded-2xl">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block aspect-[16/10] w-full cursor-zoom-in bg-gray-100"
          aria-label={`View larger images of ${title}`}
        >
          <img
            src={cloudinaryUrl(list[active], 1200)}
            alt={`${title} — image ${active + 1} of ${list.length}`}
            className="h-full w-full object-cover"
          />
        </button>
      </div>

      {list.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-3">
          {list.map((image, index) => (
            <li key={image}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1}`}
                aria-current={index === active}
                className={`block aspect-[4/3] w-full overflow-hidden rounded-lg border-2 ${
                  index === active ? "border-brand-500" : "border-transparent"
                }`}
              >
                <img
                  src={cloudinaryUrl(image, 240)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} image viewer`}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={(event) => event.target === event.currentTarget && setOpen(false)}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close image viewer"
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <Close size={24} />
          </button>

          {list.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Previous image"
                className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="Next image"
                className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <img
            src={cloudinaryUrl(list[active], 1600)}
            alt={`${title} — image ${active + 1} of ${list.length}`}
            className="max-h-[86vh] max-w-full rounded-xl object-contain"
          />

          <p className="absolute bottom-6 text-sm font-semibold text-white/70">
            {active + 1} / {list.length}
          </p>
        </div>
      )}
    </>
  );
}
