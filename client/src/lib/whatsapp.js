import brand from "../config/brand.js";

// Lifted out of components/Fabs.jsx: five modules import this helper, only one of
// which renders the floating button, so a component file was the wrong home for it.
export const whatsappHref = (message) =>
  `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(message)}`;

// wa.me needs the bare digits, but anywhere we show the number to a visitor it should
// read the way they'd dial it: "919444192708" -> "+91 94441 92708".
export const whatsappNumber = brand.whatsapp.replace(
  /^(\d{2})(\d{5})(\d{5})$/,
  "+$1 $2 $3",
);
