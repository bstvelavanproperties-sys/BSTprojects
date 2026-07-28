// Imported by BOTH the server (share-preview titles) and the client (cards, detail pages),
// so a price can never render two different ways depending on who drew it.

// Matches the convention used across Indian property listings: whole numbers show no
// decimals (₹85 L), fractional values keep two (₹2.30 Cr, ₹1.30 L).
const scale = (amount, divisor, unit) => {
  const value = amount / divisor;
  const text = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return `₹${text} ${unit}`;
};

export const formatINR = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  if (amount >= 10000000) return scale(amount, 10000000, "Cr");
  if (amount >= 100000) return scale(amount, 100000, "L");
  if (amount >= 1000) return scale(amount, 1000, "K");
  return `₹${amount.toLocaleString("en-IN")}`;
};

export const formatFullINR = (value) =>
  Number.isFinite(Number(value)) ? `₹${Number(value).toLocaleString("en-IN")}` : "";

// The reference renders prices in several shapes:
//   "₹2.30 Cr Per Acre" · "Per Flat ₹80 L Total Price 2.40 Cr" · "₹30 K Per Month"
export const priceParts = (property) => ({
  prefix: property.pricePrefix || "",
  amount: formatINR(property.price),
  suffix: property.priceSuffix || "",
  note: property.priceNote || "",
});

export const priceText = (property) => {
  const { prefix, amount, suffix, note } = priceParts(property);
  return [prefix, amount, suffix, note].filter(Boolean).join(" ");
};
