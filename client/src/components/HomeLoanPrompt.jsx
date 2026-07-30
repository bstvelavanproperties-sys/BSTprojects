import { useEffect, useRef, useState } from "react";
import brand from "../config/brand.js";
import { isLoanPromptSnoozed, snoozeLoanPrompt, track } from "../lib/storage.js";
import { whatsappHref } from "../lib/whatsapp.js";
import { Close, Phone, WhatsApp } from "./Icons.jsx";

// Finance is the step that stalls most purchases, and the agency's help with it is
// buried in the FAQ. This surfaces it once, then gets out of the way.
//
// Deliberately not on arrival: a modal that lands before the visitor has seen a single
// property reads as an ad and gets closed on reflex. Waiting until they have browsed
// for a bit means it arrives while they are actually thinking about affording one.
const DELAY_MS = 8000;

export default function HomeLoanPrompt() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    if (isLoanPromptSnoozed()) return undefined;
    const timer = setTimeout(() => {
      setOpen(true);
      track("loan_prompt_shown");
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Closing always snoozes, however it was closed — Escape, the backdrop and the X all
  // mean the same thing, and a prompt that reappears on the next page view is worse
  // than one nobody ever sees.
  const dismiss = (reason) => {
    snoozeLoanPrompt();
    setOpen(false);
    track("loan_prompt_dismissed", { reason });
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === "Escape" && dismiss("escape");
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const phone = brand.phones[0];
  const message = `Hi ${brand.name}, I'd like to know about home loan options.`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="loan-prompt-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={(event) => event.target === event.currentTarget && dismiss("backdrop")}
    >
      <div className="card relative w-full max-w-sm p-6 text-center">
        <button
          ref={closeRef}
          type="button"
          onClick={() => dismiss("close")}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-gray-100 hover:text-navy-700"
        >
          <Close size={20} />
        </button>

        <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-brand-500">
          Home loans
        </p>
        <p id="loan-prompt-title" className="mb-2 text-xl font-extrabold text-navy-700">
          Home loans are available
        </p>
        {/* Matches the answer already given on the FAQ page: we introduce, we do not lend. */}
        <p className="mb-6 text-sm text-muted">
          We work with several banks and can put you in touch with a manager who handles
          property loans — and walk you through the paperwork. Talk to us before you
          shortlist.
        </p>

        <a
          href={`tel:${phone.replace(/\s/g, "")}`}
          onClick={() => track("loan_prompt_call")}
          className="btn-outline mb-3 w-full"
        >
          <Phone size={18} /> {phone}
        </a>
        <a
          href={whatsappHref(message)}
          target="_blank"
          rel="noreferrer noopener"
          onClick={() => track("loan_prompt_whatsapp")}
          className="btn w-full bg-chat text-white hover:brightness-95"
        >
          <WhatsApp size={18} /> Ask on WhatsApp
        </a>
      </div>
    </div>
  );
}
