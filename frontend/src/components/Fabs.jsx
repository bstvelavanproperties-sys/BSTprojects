import { useEffect, useState } from "react";
import brand from "../data/brand.js";
import { track } from "../lib/storage.js";
import { ArrowUp, WhatsApp } from "./Icons.jsx";

export const whatsappHref = (message) =>
  `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(message)}`;

export function WhatsAppFab() {
  return (
    <a
      href={whatsappHref(`Hi ${brand.name}, I'd like to know more about your properties.`)}
      target="_blank"
      rel="noreferrer noopener"
      onClick={() => track("whatsapp_fab_click")}
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-chat text-white shadow-lg transition-transform hover:scale-105"
    >
      <WhatsApp size={28} />
    </a>
  );
}

export function ScrollTopFab() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-6 left-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transition-transform hover:scale-105"
    >
      <ArrowUp size={20} />
    </button>
  );
}
