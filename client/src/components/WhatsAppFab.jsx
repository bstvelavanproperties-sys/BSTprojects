import brand from "../config/brand.js";
import { track } from "../lib/storage.js";
import { whatsappHref } from "../lib/whatsapp.js";
import { WhatsApp } from "./Icons.jsx";

export default function WhatsAppFab() {
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
