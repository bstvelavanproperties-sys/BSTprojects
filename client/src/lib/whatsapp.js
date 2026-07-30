import brand from "../config/brand.js";

// Lifted out of components/Fabs.jsx: five modules import this helper, only one of
// which renders the floating button, so a component file was the wrong home for it.
export const whatsappHref = (message) =>
  `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(message)}`;
