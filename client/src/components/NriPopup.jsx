import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { track } from "../lib/storage.js";
import { ArrowRight, Close, Globe } from "./Icons.jsx";

// The homepage prompt for buyers living abroad. It rides the top-right corner because
// that is the one edge of the home page nothing else claims — the WhatsApp and
// scroll-to-top buttons sit along the bottom, and the compare bar docks under them.
//
// 2500ms, the same delay LoanToast uses: the Preloader covers the viewport at z-100
// for FIRST_MS + FADE_MS (1780ms) on a cold load and locks body scroll while it is
// opaque, so anything earlier animates in behind the splash and is never seen.
const DELAY_MS = 2500;

// Dismissal lives here, at module scope, rather than in sessionStorage.
//
// The distinction is deliberate. A module variable survives React remounts, so clicking
// away to a listing and coming back to the homepage does NOT bring the prompt back — being
// pitched the same thing on every visit to / would be nagging. But it is wiped by a page
// reload, so refreshing shows the offer again, which is what we want: a reload is a fresh
// look at the site, and this is the one prompt we lead with.
//
// sessionStorage would have outlived the reload; localStorage would have outlived the week.
let dismissedThisLoad = false;

export default function NriPopup({ content = {} }) {
  const [open, setOpen] = useState(false);

  // An empty title is the off switch. PATCH /content runs cleanText() over every
  // value, so a boolean "enabled" field would come back as the string "false" and
  // read as truthy — clearing the title in the admin panel is the honest control.
  const title = content.nriPopupTitle || "";

  useEffect(() => {
    if (typeof window === "undefined" || !title || dismissedThisLoad) return undefined;
    const timer = setTimeout(() => {
      setOpen(true);
      track("nri_popup_shown");
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, [title]);

  const dismiss = () => {
    dismissedThisLoad = true;
    setOpen(false);
    track("nri_popup_dismissed");
  };

  if (!open) return null;

  const body = content.nriPopupBody || "";
  const cta = content.nriPopupCta || "Explore NRI properties";

  // top-24 clears the sticky h-20 header, which shares this z-50 and stays pinned as
  // the page scrolls. Full-width on a phone, a fixed card from sm up.
  return (
    <aside
      role="status"
      aria-label="NRI property services"
      className="toast-in fixed top-24 right-4 left-4 z-50 sm:left-auto sm:w-84"
    >
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-gold-400 to-gold-500 p-4 text-navy-900 shadow-[0_18px_40px_rgba(13,33,67,0.35)] sm:p-5">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-10 h-32 w-32 rounded-full bg-white/25"
        />

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full text-navy-900/60 hover:bg-white/30 hover:text-navy-900"
        >
          <Close size={18} />
        </button>

        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/30">
            <Globe size={20} />
          </span>
          <span className="rounded-full bg-navy-900 px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-gold-400 uppercase">
            NRI corner
          </span>
        </div>

        <p className="mb-1.5 text-lg font-extrabold">{title}</p>
        {body && <p className="mb-4 text-sm leading-relaxed text-navy-900/80">{body}</p>}

        <Link
          to="/nri"
          onClick={() => track("nri_popup_click")}
          className="btn w-full bg-navy-900 text-white hover:bg-navy-700"
        >
          {cta} <ArrowRight size={16} />
        </Link>
      </div>
    </aside>
  );
}
