// Meta tags and structured data for the static routes.
//
// WHY THIS EXISTS
// shared/meta.js already solves this for one route, /real-estate/:slug. Every other page
// shipped the SAME <title> and description straight out of client/index.html, because a
// React SPA only corrects its <head> after the bundle boots. Google renders JavaScript, but
// it does so on a delay and not reliably — so ten distinct pages looked like ten copies of
// the homepage, which suppresses indexing and hands every result a generic snippet.
//
// The titles and descriptions below are therefore the SINGLE source: this module renders
// them into the HTML for crawlers, and client/src/lib/usePageMeta.js reads the same table
// for in-app navigation. They cannot drift apart.

import { escapeHtml } from "./meta.js";
import { faqs, nriFaqs } from "./faqs.js";

export const SITE_NAME = "BST Velavan Properties";

// Title formula: search intent first, brand last.
//
// "Our Services — BST Velavan Properties" describes the page from the inside; nobody types
// "our services" into Google. "Property Management Services in Chennai" is what someone
// actually searches for, and it is the same page. The brand suffix stays because it earns
// the click once a visitor has seen the site before — but it goes at the end, where a
// truncated SERP title loses it harmlessly.
const withBrand = (title) => `${title} | ${SITE_NAME}`;

export const PAGES = {
  "/": {
    title: withBrand("Real Estate Agents in Chennai — Plots, Villas & Flats"),
    description:
      "Verified plots, villas, flats and commercial space across Chennai and Tamil Nadu. Free property search for buyers, full documentation support, and management after you buy.",
  },
  "/properties": {
    title: withBrand("Properties in Chennai — Buy, Rent & Invest"),
    description:
      "Browse every verified listing in Chennai and Tamil Nadu — plots, villas, apartments, independent houses and commercial space. Filter by area, budget and property type.",
  },
  "/buy": {
    title: withBrand("Property for Sale in Chennai — Verified Plots & Houses"),
    description:
      "Plots, villas, flats and houses for sale in Anna Nagar, Avadi, Velachery, Madipakkam, ECR and across Chennai. Every title checked before listing. No fee for buyers.",
  },
  "/rent": {
    title: withBrand("Property for Rent in Chennai — Houses, Flats & Shops"),
    description:
      "Houses, apartments, office and commercial space for rent across Chennai. Verified owners, agreements drafted for you, and rent collection handled end to end.",
  },
  "/nri": {
    title: withBrand("NRI Property Services in Chennai — POA & Title Checks"),
    description:
      "Buying property in Chennai from the USA, UAE, UK or Singapore. Power of attorney, title verification, video site visits and year-round management once you fly home.",
  },
  "/services": {
    title: withBrand("Property Management Services in Chennai — Rent & Upkeep"),
    description:
      "Property and rental management in Chennai: tenant sourcing, rent collection, maintenance, legal documentation and title verification. We manage, we care, you relax.",
  },
  "/find-my-property": {
    title: withBrand("Find My Property — Free Property Search in Chennai"),
    description:
      "Answer five quick questions and we'll shortlist the Chennai properties that actually fit your budget and area — then send them straight to your WhatsApp. Free for buyers.",
  },
  "/affordability": {
    title: withBrand("Home Affordability Calculator — Chennai Property Budget"),
    description:
      "Work out what you can genuinely afford before you start looking. Enter a monthly payment and see the Chennai properties that fit, with an EMI estimate for each.",
  },
  "/property-wanted": {
    title: withBrand("Property Wanted in Chennai — Tell Us What You Need"),
    description:
      "A good part of our inventory never reaches the website. Tell us the area, budget and property type you're after and we'll search on your behalf, at no charge.",
  },
  "/faqs": {
    title: withBrand("Property Buying FAQs — Documents, Fees & Timelines"),
    description:
      "What documents to check before buying in Tamil Nadu, how long a sale takes to close, what we charge, and how property management works. Straight answers, no jargon.",
  },
  "/about": {
    title: withBrand("About Us — Trusted Property Agents in Chennai"),
    description:
      "How BST Velavan Properties works with buyers, sellers and owners across Chennai. Transparent deals, verified listings and legal support from first call to handover.",
  },
  "/contact": {
    title: withBrand("Contact Us — Property Agents in Anna Nagar, Chennai"),
    description:
      "Call, WhatsApp or visit our Anna Nagar office. Tell us what you're buying, selling or renting in Chennai and we'll come back to you the same day.",
  },
};

export const pageMetaFor = (path) => PAGES[path] || PAGES["/"];

export const isMetaRoute = (path) => Object.hasOwn(PAGES, path);

// ---------------------------------------------------------------------------
// Structured data
// ---------------------------------------------------------------------------

const faqLd = (list) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: list.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
});

// NOTE: no aggregateRating, deliberately.
//
// server/src/data/properties.js documents that the testimonial list was emptied on purpose —
// invented social proof is dishonest, and on a regulated trade a genuine liability. Rating
// markup with no real reviews behind it is the same act in a machine-readable form, and it is
// also a direct Google structured-data violation. Worth adding once real reviews exist.
const businessLd = (brand, origin) => {
  const office = brand.offices?.head;
  const lines = office?.lines || [];

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${origin}/#organization`,
    name: brand.legalName || brand.name,
    url: origin,
    logo: `${origin}${brand.logoFull || brand.logo}`,
    image: `${origin}/assets/og-cover.png`,
    description: PAGES["/"].description,
    telephone: brand.phones,
    email: brand.emails,
    address: {
      "@type": "PostalAddress",
      // The office block is four display lines: street, colony, city, "State PIN".
      streetAddress: lines.slice(0, 2).join(", "),
      addressLocality: "Chennai",
      addressRegion: "Tamil Nadu",
      postalCode: "600040",
      addressCountry: "IN",
    },
    areaServed: ["Chennai", "Tamil Nadu", "Coimbatore", "Madurai"].map((name) => ({
      "@type": "City",
      name,
    })),
    sameAs: Object.values(brand.socials || {}).filter(Boolean),
  };
};

// Enables the sitelinks searchbox — a second, query-specific entry point straight into the
// listings page from the result itself.
const websiteLd = (origin) => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: origin,
  name: SITE_NAME,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${origin}/properties?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
});

const breadcrumbLd = (origin, trail) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map((crumb, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: crumb.name,
    item: `${origin}${crumb.path}`,
  })),
});

const servicesLd = (services, origin) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: services.map((service, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Service",
      name: service.title,
      description: service.copy,
      serviceType: service.title,
      areaServed: { "@type": "City", name: "Chennai" },
      provider: { "@id": `${origin}/#organization` },
    },
  })),
});

const BREADCRUMBS = {
  "/properties": [{ name: "Home", path: "/" }, { name: "Properties", path: "/properties" }],
  "/buy": [{ name: "Home", path: "/" }, { name: "For Sale", path: "/buy" }],
  "/rent": [{ name: "Home", path: "/" }, { name: "For Rent", path: "/rent" }],
  "/nri": [{ name: "Home", path: "/" }, { name: "NRI Corner", path: "/nri" }],
  "/services": [{ name: "Home", path: "/" }, { name: "Services", path: "/services" }],
  "/faqs": [{ name: "Home", path: "/" }, { name: "FAQs", path: "/faqs" }],
};

const structuredDataFor = (path, { origin, brand, services }) => {
  const blocks = [];

  // `brand` and `services` are optional: the Express fallback path in server.js can render
  // titles, descriptions and canonicals without loading client config. The blocks that need
  // that data simply drop out rather than throwing.
  if (path === "/") {
    if (brand) blocks.push(businessLd(brand, origin));
    blocks.push(websiteLd(origin));
  }
  if (path === "/faqs") blocks.push(faqLd(faqs));
  if (path === "/nri") blocks.push(faqLd(nriFaqs));
  if (path === "/services" && services?.length) blocks.push(servicesLd(services, origin));
  if (BREADCRUMBS[path]) blocks.push(breadcrumbLd(origin, BREADCRUMBS[path]));

  return blocks;
};

// ---------------------------------------------------------------------------

/**
 * The <head> contents for a static route, ready to drop between the <!--meta--> markers
 * with injectMeta() from shared/meta.js.
 *
 * `path` must already be stripped of its query string. The canonical deliberately carries no
 * query: /properties?city=Chennai&maxPrice=… is a filtered VIEW of /properties, not a separate
 * page, and left uncanonicalised every filter combination becomes a duplicate competing with
 * the page it came from.
 */
export const renderPageMeta = (path, { origin, siteName = SITE_NAME, brand, services } = {}) => {
  const meta = pageMetaFor(path);
  const url = `${origin}${path === "/" ? "" : path}`;
  // Absolute, because Open Graph requires it — a relative og:image is why link previews for
  // these pages have been arriving without a picture.
  const image = `${origin}/assets/og-cover.png`;

  const jsonLd = structuredDataFor(path, { origin, brand, services })
    .map((block) => `<script type="application/ld+json">${JSON.stringify(block)}</script>`)
    .join("\n    ");

  return `
    <title>${escapeHtml(meta.title)}</title>
    <meta name="description" content="${escapeHtml(meta.description)}" />
    <link rel="canonical" href="${escapeHtml(url)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta name="author" content="${escapeHtml(siteName)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${escapeHtml(siteName)}" />
    <meta property="og:title" content="${escapeHtml(meta.title)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:locale" content="en_IN" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    ${jsonLd}
  `.trim();
};
