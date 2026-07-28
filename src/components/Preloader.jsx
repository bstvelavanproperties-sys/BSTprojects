import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import brand from "../data/brand.js";

// ---------------------------------------------------------------------------
// Timings — the two knobs worth touching.
//   FIRST_MS : initial load and every reload (the full animation)
//   ROUTE_MS : navigating between pages — same animation, condensed, because a
//              full-length overlay on every internal click reads as a broken site
//   FADE_MS  : cross-fade out
// ---------------------------------------------------------------------------
const FIRST_MS = 1400;
const ROUTE_MS = 700;
const FADE_MS = 380;

// Baseline animation schedule, expressed against FIRST_MS and scaled for route changes.
const BASE = {
  circle: { dur: 1100, delay: 120 },
  v: { dur: 700, delay: 260 },
  arrow: { dur: 460, delay: 760 },
  head: { dur: 300, delay: 1080 },
  name: { dur: 600, delay: 700 },
  tagline: { dur: 600, delay: 880 },
  bar: 45,
};

const SKYLINE = [38, 62, 30, 84, 52, 96, 44, 70, 34, 58, 46, 78, 36, 66, 50, 88, 40, 60];

export default function Preloader() {
  const { pathname } = useLocation();
  const isFirstRun = useRef(true);

  const [phase, setPhase] = useState("in"); // "in" | "out" | "hidden"
  const [duration, setDuration] = useState(FIRST_MS);
  const [progress, setProgress] = useState(0);
  const [run, setRun] = useState(0); // remounts the animated nodes each time

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const first = isFirstRun.current;
    isFirstRun.current = false;

    // Honour reduced-motion: no overlay, no animation.
    if (reduced) {
      setPhase("hidden");
      return undefined;
    }

    // Navigating to a new page starts at the top, and the overlay hides the jump.
    if (!first) window.scrollTo({ top: 0, behavior: "instant" });

    const ms = first ? FIRST_MS : ROUTE_MS;
    setDuration(ms);
    setProgress(0);
    setPhase("in");
    setRun((value) => value + 1);

    const started = Date.now();
    const tick = setInterval(() => {
      setProgress(Math.min(100, ((Date.now() - started) / ms) * 100));
    }, 40);

    const out = setTimeout(() => setPhase("out"), ms);
    const hide = setTimeout(() => setPhase("hidden"), ms + FADE_MS);

    return () => {
      clearInterval(tick);
      clearTimeout(out);
      clearTimeout(hide);
    };
  }, [pathname]);

  // Lock scrolling only while the overlay is fully opaque — it releases as the fade
  // starts, so the page is interactive again before the overlay finishes leaving.
  useEffect(() => {
    if (phase !== "in") {
      document.body.style.overflow = "";
      return undefined;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  if (phase === "hidden") return null;

  // Scale the baseline schedule so a 700ms run still completes its animation.
  const k = duration / FIRST_MS;
  const at = ({ dur, delay }) => `${Math.round(dur * k)}ms ease-out ${Math.round(delay * k)}ms`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Loading ${brand.name}`}
      className={`fixed inset-0 z-100 flex flex-col items-center justify-center bg-navy-900
                  transition-opacity ${phase === "out" ? "pointer-events-none opacity-0" : "opacity-100"}`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 flex h-36 items-end gap-1.5 px-1.5 opacity-20"
      >
        {SKYLINE.map((height, index) => (
          <span
            key={`${run}-${index}`}
            className="flex-1 rounded-t bg-white"
            style={{
              height: `${height}%`,
              animation: `preload-rise ${Math.round(900 * k)}ms cubic-bezier(0.22,1,0.36,1) ${Math.round(
                index * BASE.bar * k,
              )}ms both`,
            }}
          />
        ))}
      </div>

      <svg key={run} viewBox="0 0 120 120" className="mb-7 h-24 w-24" aria-hidden="true">
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="#dc1c24"
          strokeWidth="3"
          strokeDasharray="340"
          strokeDashoffset="340"
          style={{ animation: `preload-draw ${at(BASE.circle)} forwards` }}
        />
        {/* The V */}
        <path
          d="M30 38 55 92 68 62"
          fill="none"
          stroke="#ffffff"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="130"
          strokeDashoffset="130"
          style={{ animation: `preload-draw ${at(BASE.v)} forwards` }}
        />
        {/* Growth arrow */}
        <path
          d="M66 66 92 30"
          fill="none"
          stroke="#dc1c24"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray="46"
          strokeDashoffset="46"
          style={{ animation: `preload-draw ${at(BASE.arrow)} forwards` }}
        />
        <path
          d="M78 28h16v16"
          fill="none"
          stroke="#dc1c24"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0"
          style={{ animation: `preload-fade ${at(BASE.head)} forwards` }}
        />
      </svg>

      <p
        key={`n-${run}`}
        className="mb-1 text-2xl font-extrabold text-white opacity-0"
        style={{ animation: `preload-up ${at(BASE.name)} forwards` }}
      >
        {brand.shortName}
      </p>
      <p
        key={`t-${run}`}
        className="mb-8 text-sm font-bold tracking-wide text-brand-500 opacity-0"
        style={{ animation: `preload-up ${at(BASE.tagline)} forwards` }}
      >
        {brand.tagline}
      </p>

      <div className="h-0.5 w-48 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-brand-500 transition-[width] duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <button
        type="button"
        onClick={() => setPhase("out")}
        className="absolute right-6 top-6 rounded-full px-3 py-1.5 text-xs font-bold text-white/50 transition-colors hover:bg-white/10 hover:text-white"
      >
        Skip
      </button>
    </div>
  );
}
