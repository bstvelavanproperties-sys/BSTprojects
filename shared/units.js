// Imported by BOTH the server (Property pre-save hook) and the client (display + sorting).
// One conversion table so a 2-ground plot can never sort below a 1,000 sqft flat.

export const AREA_UNITS = {
  sqft: { label: "Sq.ft", sqft: 1 },
  ground: { label: "Ground", sqft: 2400 }, // Tamil Nadu land unit
  cent: { label: "Cent", sqft: 435.6 },
  acre: { label: "Acre", sqft: 43560 },
};

export const toSqft = (value, unit) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * (AREA_UNITS[unit]?.sqft ?? 1));
};

export const unitLabel = (unit) => AREA_UNITS[unit]?.label || "Sq.ft";
