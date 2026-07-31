import { useEffect, useState } from "react";
import brand from "../config/brand.js";
import { useCompare } from "../context/compareContext.js";
import { track } from "../lib/storage.js";
import { whatsappHref } from "../lib/whatsapp.js";
import { Bank, Close, Phone, WhatsApp } from "./Icons.jsx";

// Finance is the step that stalls most purchases, and it is on someone's mind the
// moment a price is in front of them — so this rides the property page rather than
// the whole site, and slides in at the side instead of taking the screen over.
const DELAY_MS = 2500;
const DISMISSED_KEY = "bstv-loan-toast-dismissed";

// Session-scoped, not permanent: dismissing it means "not on this visit", so a
// browser opened next week gets the offer again.
const wasDismissed = () => {
  try {
    return window.sessionStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
};

export default function LoanToast({ property }) {
  const [open, setOpen] = useState(false);
  const { slugs } = useCompare();

  useEffect(() => {
    if (typeof window === "undefined" || wasDismissed()) return undefined;
    const timer = setTimeout(() => {
      setOpen(true);
      track("loan_toast_shown", { slug: property.slug });
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, [property.slug]);

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* private browsing — it just reappears on the next property */
    }
    setOpen(false);
    track("loan_toast_dismissed");
  };

  if (!open) return null;

  const phone = brand.phones[0];
  const message = `Hi ${brand.name}, I'm interested in "${property.title}" — could you tell me about the home loan options?`;

  // Sits clear of the WhatsApp button, and higher still when the compare bar is
  // docked along the bottom of the same page.
  return (
    <aside
      role="status"
      aria-label="Home loans available"
      className={`toast-in fixed right-4 left-4 z-50 sm:left-auto sm:w-84 ${
        slugs.length ? "bottom-40" : "bottom-24"
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-brand-500 to-brand-700 p-4 text-white shadow-[0_18px_40px_rgba(13,33,67,0.35)] sm:p-5">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-10 h-32 w-32 rounded-full bg-white/10"
        />

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/15 hover:text-white"
        >
          <Close size={18} />
        </button>

        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Bank size={20} />
          </span>
          <span className="rounded-full bg-gold-500 px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-navy-900 uppercase">
            Home loans
          </span>
        </div>

        <p className="mb-1.5 text-lg font-extrabold">Loans are available</p>
        {/* Same promise as the FAQ and the services card: we introduce and guide. */}
        <p className="mb-4 text-sm leading-relaxed text-white/85">
          We&apos;ll connect you with a bank manager and handle the paperwork.
        </p>

        {/* px-4 over the .btn default so both labels fit side by side on a phone. */}
        <div className="flex gap-2">
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            onClick={() => track("loan_toast_call", { slug: property.slug })}
            className="btn flex-1 bg-white px-4 text-brand-500 hover:bg-brand-50"
          >
            <Phone size={16} /> Call
          </a>
          <a
            href={whatsappHref(message)}
            target="_blank"
            rel="noreferrer noopener"
            onClick={() => track("loan_toast_whatsapp", { slug: property.slug })}
            className="btn flex-1 bg-chat px-4 text-white hover:brightness-95"
          >
            <WhatsApp size={16} /> WhatsApp
          </a>
        </div>
      </div>
    </aside>
  );
}
