import { useEffect, useRef } from "react";

// Adds .is-visible the first time an element scrolls into view, then stops observing it.
// Falls back to showing everything if IntersectionObserver is unavailable.
export const useReveal = (deps = []) => {
  const root = useRef(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return undefined;

    const targets = node.querySelectorAll(".reveal:not(.is-visible)");
    if (!targets.length) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      targets.forEach((el) => el.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return root;
};

// Stagger helper: `style={revealDelay(i)}` on repeated cards.
export const revealDelay = (index, step = 70, max = 6) => ({
  transitionDelay: `${Math.min(index, max) * step}ms`,
});
