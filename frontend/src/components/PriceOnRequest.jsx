import { useEffect, useRef, useState } from "react";
import brand from "../data/brand.js";
import { track } from "../lib/storage.js";
import { whatsappHref } from "./Fabs.jsx";
import { Close, Phone, WhatsApp } from "./Icons.jsx";

// Listings can withhold their price to start a conversation instead. Tapping the
// "Price on Request" label opens this prompt — it never reveals a number, it just
// routes the visitor to a call or a WhatsApp chat.
export default function PriceOnRequest({ property, className = "", children }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const phone = brand.phones[0];
  const message = `Hi ${brand.name}, could you share the price for "${property.title}"?`;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          track("price_request_open", { slug: property.slug });
        }}
        aria-haspopup="dialog"
        title="Contact us for the price"
        className={className}
      >
        {children}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="price-request-title"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          onClick={(event) => event.target === event.currentTarget && setOpen(false)}
        >
          <div className="card relative w-full max-w-sm p-6 text-center">
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-gray-100 hover:text-navy-700"
            >
              <Close size={20} />
            </button>

            <p id="price-request-title" className="mb-2 text-xl font-extrabold text-navy-700">
              Price on request
            </p>
            <p className="mb-6 text-sm text-muted">
              Call or message us and we&apos;ll share the price for{" "}
              <span className="font-bold text-navy-700">{property.title}</span>.
            </p>

            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              onClick={() => track("price_request_call", { slug: property.slug })}
              className="btn-outline mb-3 w-full"
            >
              <Phone size={18} /> {phone}
            </a>
            <a
              href={whatsappHref(message)}
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => track("price_request_whatsapp", { slug: property.slug })}
              className="btn w-full bg-chat text-white hover:brightness-95"
            >
              <WhatsApp size={18} /> Ask on WhatsApp
            </a>
          </div>
        </div>
      )}
    </>
  );
}
