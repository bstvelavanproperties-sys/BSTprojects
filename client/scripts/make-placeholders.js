// Generates self-contained placeholder SVGs so the site renders with no external assets.
// The logo is NOT among them — assets/logo-mark.png and logo.png are the real brand
// artwork and must not be overwritten by a generated stand-in.
// Replace client/public/assets/properties/*.svg with the client's real photographs.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "public", "assets");
const propertyDir = path.join(assets, "properties");

mkdirSync(propertyDir, { recursive: true });

const PALETTES = {
  plot: ["#c7b299", "#e6dbc9"],
  house: ["#7fa8d4", "#cfe0f2"],
  farm: ["#6fae7d", "#c3e0c8"],
  flat: ["#9a8fc4", "#ddd7ee"],
  villa: ["#e0a35f", "#f5dcbc"],
  commercial: ["#6f9bb3", "#c9dee8"],
  placeholder: ["#b6bcc7", "#e2e5ea"],
};

const buildingsFor = (kind) => {
  if (kind === "farm") {
    return `
      <ellipse cx="180" cy="330" rx="70" ry="18" fill="#ffffff" opacity="0.25"/>
      <path d="M470 300c0-34 26-60 58-60s58 26 58 60z" fill="#ffffff" opacity="0.35"/>
      <path d="M120 300h560" stroke="#ffffff" stroke-width="3" opacity="0.35" stroke-dasharray="14 10"/>`;
  }
  if (kind === "plot") {
    return `
      <rect x="180" y="215" width="440" height="130" fill="none" stroke="#ffffff" stroke-width="4"
            opacity="0.55" stroke-dasharray="18 12"/>
      <circle cx="180" cy="215" r="7" fill="#ffffff" opacity="0.7"/>
      <circle cx="620" cy="215" r="7" fill="#ffffff" opacity="0.7"/>
      <circle cx="180" cy="345" r="7" fill="#ffffff" opacity="0.7"/>
      <circle cx="620" cy="345" r="7" fill="#ffffff" opacity="0.7"/>`;
  }
  if (kind === "commercial") {
    return `
      <rect x="240" y="150" width="130" height="195" fill="#ffffff" opacity="0.5"/>
      <rect x="390" y="200" width="110" height="145" fill="#ffffff" opacity="0.38"/>
      <rect x="520" y="120" width="110" height="225" fill="#ffffff" opacity="0.46"/>
      ${grid(255, 170, 4, 6, 22)}${grid(405, 220, 3, 4, 22)}${grid(535, 140, 3, 7, 22)}`;
  }
  if (kind === "flat") {
    return `
      <rect x="270" y="130" width="260" height="215" fill="#ffffff" opacity="0.48"/>
      ${grid(292, 152, 5, 6, 30)}
      <rect x="370" y="300" width="60" height="45" fill="#ffffff" opacity="0.75"/>`;
  }
  // house / villa
  return `
    <path d="M250 230 400 130 550 230v115H250z" fill="#ffffff" opacity="0.5"/>
    <rect x="370" y="270" width="60" height="75" fill="#ffffff" opacity="0.8"/>
    <rect x="290" y="255" width="52" height="45" fill="#ffffff" opacity="0.7"/>
    <rect x="458" y="255" width="52" height="45" fill="#ffffff" opacity="0.7"/>`;
};

function grid(x, y, cols, rows, gap) {
  let out = "";
  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      out += `<rect x="${x + c * gap}" y="${y + r * gap}" width="12" height="14" fill="#14315f" opacity="0.28"/>`;
    }
  }
  return out;
}

const svg = (kind, caption) => {
  const [from, to] = PALETTES[kind] || PALETTES.placeholder;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500" role="img" aria-label="${caption}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${to}"/>
      <stop offset="1" stop-color="${from}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#bg)"/>
  <circle cx="655" cy="95" r="42" fill="#ffffff" opacity="0.45"/>
${buildingsFor(kind)}
  <rect y="345" width="800" height="155" fill="#14315f" opacity="0.14"/>
  <text x="400" y="425" text-anchor="middle" font-family="Nunito, system-ui, sans-serif"
        font-size="26" font-weight="800" fill="#14315f" opacity="0.62">${caption}</text>
</svg>`;
};

const properties = [
  ["plot-1", "plot", "Plot"],
  ["house-1", "house", "Independent House"],
  ["farm-1", "farm", "Farm House"],
  ["flat-1", "flat", "Flat / Apartment"],
  ["villa-1", "villa", "Villa"],
  ["commercial-1", "commercial", "Commercial Space"],
  ["placeholder", "placeholder", "Photograph coming soon"],
];

for (const [name, kind, caption] of properties) {
  writeFileSync(path.join(propertyDir, `${name}.svg`), svg(kind, caption));
}

// "Best Platform" section image.
writeFileSync(
  path.join(assets, "platform.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 900" width="800" height="900">
  <defs>
    <linearGradient id="p" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9fc4e8"/><stop offset="1" stop-color="#dceaf7"/>
    </linearGradient>
  </defs>
  <rect width="800" height="900" fill="url(#p)"/>
  <circle cx="640" cy="150" r="70" fill="#ffffff" opacity="0.5"/>
  <path d="M250 520 400 380l150 140v250H250z" fill="#ffffff" opacity="0.55"/>
  <rect x="360" y="600" width="80" height="170" fill="#dc1c24" opacity="0.5"/>
  <rect x="285" y="560" width="55" height="50" fill="#14315f" opacity="0.25"/>
  <rect x="460" y="560" width="55" height="50" fill="#14315f" opacity="0.25"/>
  <rect x="120" y="770" width="560" height="14" rx="7" fill="#14315f" opacity="0.2"/>
  <text x="400" y="850" text-anchor="middle" font-family="Nunito, system-ui, sans-serif"
        font-size="26" font-weight="800" fill="#14315f" opacity="0.5">Your next home</text>
</svg>`,
);

// Testimonials illustration.
writeFileSync(
  path.join(assets, "keys.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 480" width="600" height="480">
  <circle cx="300" cy="240" r="200" fill="#fdf1f1"/>
  <path d="M210 300 330 190l120 110v130H210z" fill="#ffffff"/>
  <path d="M330 178 462 300H198z" fill="#dc1c24" opacity="0.85"/>
  <rect x="290" y="345" width="70" height="85" fill="#dc1c24" opacity="0.3"/>
  <rect x="235" y="320" width="46" height="42" fill="#14315f" opacity="0.18"/>
  <rect x="372" y="320" width="46" height="42" fill="#14315f" opacity="0.18"/>
  <circle cx="132" cy="392" r="34" fill="none" stroke="#14315f" stroke-width="12" opacity="0.35"/>
  <path d="M160 392h96v-20h18v20h16v22h-16v18h-18v-18h-96z" fill="#14315f" opacity="0.35"/>
  <text x="300" y="462" text-anchor="middle" font-family="Nunito, system-ui, sans-serif"
        font-size="20" font-weight="800" fill="#dc1c24" opacity="0.7">FIND YOUR DREAM PROPERTY</text>
</svg>`,
);


console.log(`Wrote ${properties.length} property placeholders + platform, keys.`);
