import Property from "../models/Property.js";
import { live, memory } from "./memory.js";

// Input shaping shared by every write route. Lifted out of the old single-file
// server so the route handlers read as HTTP and nothing else.

export const cleanText = (value, max = 200) => String(value ?? "").trim().slice(0, max);

// The web form posts real arrays; a CSV import posts "a|b" strings for the same
// fields. Both are accepted, which is what the admin's own CSV help text promises.
export const toList = (value) => (Array.isArray(value) ? value : String(value ?? "").split("|"));

// Media URLs, de-duplicated and hard-capped. Extras are dropped rather than
// rejected: a CSV import with six photos should import five, not fail the row.
export const mediaList = (value, max) => [
  ...new Set(toList(value).map((url) => cleanText(url, 400)).filter(Boolean)),
].slice(0, max);

export const slugify = (value) =>
  cleanText(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// "Plot for sale in Velachery" is a title an agency reuses. Suffix on collision.
export const uniqueSlug = async (title) => {
  const base = slugify(title) || `property-${Date.now()}`;
  const taken = live()
    ? new Set((await Property.find({ slug: new RegExp(`^${base}(-\\d+)?$`) }, "slug").lean()).map((p) => p.slug))
    : new Set(memory.properties.filter((p) => p.slug?.startsWith(base)).map((p) => p.slug));

  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
};
