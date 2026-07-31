import { cities } from "../config/brand.js";

// One flat list for the city dropdowns: every city we cover, followed by anywhere
// else that happens to hold stock (a listing filed under Coimbatore, say).
//
// Counts come from /api/cities and are shown only where there is something to count —
// "Chengalpattu (0)" reads as a broken site, while a bare "Chengalpattu" reads as a
// place you can ask about, which is what the empty state then invites.
export const cityOptions = (rows = []) => {
  const counts = new Map(rows.map((row) => [row.city.toLowerCase(), row.count]));
  const listed = new Set(cities.map((city) => city.toLowerCase()));

  return [
    ...cities.map((city) => {
      const count = counts.get(city.toLowerCase());
      return { value: city, label: count ? `${city} (${count})` : city };
    }),
    ...rows
      .filter((row) => !listed.has(row.city.toLowerCase()))
      .map((row) => ({ value: row.city, label: `${row.city} (${row.count})` })),
  ];
};
