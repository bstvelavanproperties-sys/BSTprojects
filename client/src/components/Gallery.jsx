import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { defaultPropertyImage } from "@bstv/shared/propertyImages.js";
import { cloudinaryPoster, cloudinaryUrl, isVideoUrl } from "../lib/format.js";
import { ChevronLeft, ChevronRight, Close, Play } from "./Icons.jsx";

// Videos are delivered at their original Cloudinary URL, untransformed. Any transform
// makes Cloudinary derive a new rendition on first request, and until that finishes
// the URL returns 423 — which a browser shows as a video that just won't play. The
// poster frame is a still image, derived instantly, so it carries the visual weight.
export default function Gallery({ images = [], videos = [], title, propertyType }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);
  const previouslyFocused = useRef(null);

  // Photos first, then videos — the first photo stays the hero shot regardless of
  // upload order, which is what the card thumbnail already assumes. Each URL is
  // re-checked rather than trusted to its field, so a video pasted into the photos
  // box still renders as a player instead of a broken image.
  const list = useMemo(() => {
    const media = [...images, ...videos]
      .filter(Boolean)
      .map((url) => ({ url, video: isVideoUrl(url) }));
    media.sort((a, b) => Number(a.video) - Number(b.video));
    return media.length ? media : [{ url: defaultPropertyImage(propertyType), video: false }];
  }, [images, videos, propertyType]);

  const current = list[Math.min(active, list.length - 1)] || list[0];

  const move = useCallback(
    (step) => setActive((index) => (index + step + list.length) % list.length),
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

  const label = (index) => `${title} — ${list[index].video ? "video" : "image"} ${index + 1} of ${list.length}`;

  return (
    <>
      <div className="overflow-hidden rounded-2xl">
        {current.video ? (
          // Not wrapped in the zoom button: the player owns its own click target,
          // and nesting controls inside a button breaks keyboard operation.
          <video
            key={current.url}
            src={current.url}
            poster={cloudinaryPoster(current.url, 1200)}
            controls
            preload="none"
            playsInline
            aria-label={label(active)}
            className="aspect-[16/10] w-full bg-black object-cover"
          />
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="block aspect-[16/10] w-full cursor-zoom-in bg-gray-100"
            aria-label={`View larger images of ${title}`}
          >
            <img
              src={cloudinaryUrl(current.url, 1200)}
              alt={label(active)}
              className="h-full w-full object-cover"
            />
          </button>
        )}
      </div>

      {list.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-3">
          {list.map((item, index) => (
            <li key={`${item.url}-${index}`}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show ${item.video ? "video" : "image"} ${index + 1}`}
                aria-current={index === active}
                className={`relative block aspect-[4/3] w-full overflow-hidden rounded-lg border-2 ${
                  index === active ? "border-brand-500" : "border-transparent"
                }`}
              >
                <img
                  src={item.video ? cloudinaryPoster(item.url, 240) : cloudinaryUrl(item.url, 240)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                {item.video && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-navy-700">
                      <Play size={16} filled />
                    </span>
                  </span>
                )}
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
                aria-label="Previous item"
                className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="Next item"
                className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {current.video ? (
            <video
              key={current.url}
              src={current.url}
              poster={cloudinaryPoster(current.url, 1600)}
              controls
              autoPlay
              playsInline
              aria-label={label(active)}
              className="max-h-[86vh] max-w-full rounded-xl bg-black"
            />
          ) : (
            <img
              src={cloudinaryUrl(current.url, 1600)}
              alt={label(active)}
              className="max-h-[86vh] max-w-full rounded-xl object-contain"
            />
          )}

          <p className="absolute bottom-6 text-sm font-semibold text-white/70">
            {active + 1} / {list.length}
          </p>
        </div>
      )}
    </>
  );
}
