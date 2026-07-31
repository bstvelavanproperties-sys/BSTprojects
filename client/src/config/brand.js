// Every brand value the site renders lives here. Nothing else hardcodes a brand string,
// so changing a phone number, an office line or a social URL here updates the whole site.

export const brand = {
  name: "BST Velavan Properties",
  shortName: "BST Velavan",
  legalName: "BST Velavan Properties",
  tagline: "Building Trust. Creating Value.",
  promise: "Your Property. Our Priority. A Relationship Built on Trust.",
  headline: "Your Trusted Partner in Property Management, Buying & Selling",
  subline: "Find your dream property. Sell with confidence.",

  slogans: {
    manage: "We Manage. We Care. You Relax.",
    find: "Find It. Love It. Own It.",
    professional: "Professional. Reliable. Responsible.",
  },

  phones: ["+91 94441 92708"],
  whatsapp: "919444192708",

  emails: ["bstvelavanproperties@gmail.com"],
  offices: {
    head: {
      label: "Office",
      lines: [
        "AG 68, 3rd Cross St, AG Block",
        "River View Colony, Anna Nagar",
        "Chennai, Greater Chennai",
        "Tamil Nadu 600040",
      ],
    },
  },
  socials: {
    youtube: "https://www.youtube.com/@bstvelavan",
    facebook: "https://www.facebook.com/share/1HvQRhdqmA/",
    instagram: "https://www.instagram.com/bst_velavan",
  },

  // The hexagonal BST monogram on its own, cut from the supplied lockup. The header
  // and admin sign-in render it at 40-44px beside their own wordmark, so the full
  // lockup would be illegible there and would repeat the words twice over.
  logo: "/assets/logo-mark.png",
  // The complete lockup — mark, wordmark and tagline — for share cards and print.
  logoFull: "/assets/logo.png",
  origin: "https://bstvelavan.com",
};

// Homepage "why us" strip — from the flyer.
export const trustPoints = [
  { icon: "shield", title: "Trusted Experts", copy: "Years of hands-on experience across the market." },
  { icon: "users", title: "Transparent Deals", copy: "Clear pricing and honest guidance, start to finish." },
  { icon: "doc", title: "Legal Support", copy: "Documentation and verification handled for you." },
  { icon: "thumb", title: "Complete Satisfaction", copy: "We stay with you until the keys change hands." },
];

// Service pillars — from the flyer.
export const services = [
  {
    slug: "property-management",
    icon: "building",
    title: "Property Management",
    copy: "End-to-end care for your property — tenants, upkeep, compliance and reporting, handled.",
  },
  {
    slug: "rental-management",
    icon: "rupee",
    title: "Rental Management",
    copy: "Tenant sourcing, agreements, rent collection and renewals without the chasing.",
  },
  {
    slug: "maintenance-services",
    icon: "tools",
    title: "Maintenance Services",
    copy: "Repairs, servicing and periodic inspections through vetted local professionals.",
  },
  {
    slug: "documentation-support",
    icon: "doc",
    title: "Documentation Support",
    copy: "Registration, title checks and paperwork prepared and verified by our legal team.",
  },
  // Wording stays in step with the FAQ answer and the home-loan prompt: we introduce
  // and guide, we do not lend. Claiming otherwise would set the wrong expectation.
  {
    slug: "loan-finance-support",
    icon: "bank",
    title: "Loan & Finance Support",
    copy: "Introductions to bank managers who handle property loans, eligibility guidance and help with the paperwork.",
  },
];

// What we actually do for a buyer or owner living abroad.
//
// Scope wording matters here as much as it does for the loan service above: we
// coordinate, verify and represent — we are not the buyer's tax adviser and we do not
// move their money. Stating a FEMA or RBI rule as fact on a property site is advice we
// are not licensed to give, so every financial line points at their own CA instead.
export const nriServices = [
  {
    icon: "doc",
    title: "Title checks & documentation",
    copy: "Encumbrance certificate, parent documents and approvals verified by our legal team before you commit a rupee.",
  },
  {
    icon: "shield",
    title: "Power of attorney",
    copy: "We prepare the POA and walk your family or our representative through registration, so you don't need to fly down to sign.",
  },
  {
    icon: "plane",
    title: "Video & proxy site visits",
    copy: "A walkthrough on video call at a time that suits your timezone, plus an honest report on the locality and the neighbours.",
  },
  {
    icon: "bank",
    title: "Payment & paperwork coordination",
    copy: "We work alongside your CA and bank on the NRE/NRO paperwork and keep the registration moving while you're away.",
  },
  {
    icon: "building",
    title: "Management after you buy",
    copy: "Tenants, rent collection, upkeep and property tax handled year-round — the same service our resident owners get.",
  },
];

// Buy / sell / rent checklists — from the flyer.
export const platformCards = [
  {
    key: "buy",
    icon: "home-buy",
    title: "Buy a property",
    copy: "Find the right property with expert guidance and a verified inventory.",
    points: [
      "Residential Properties",
      "Commercial Properties",
      "Investment Opportunities",
      "Verified Listings",
      "Best Market Value",
    ],
    cta: { label: "Buy a property", href: "/buy" },
  },
  {
    key: "sell",
    icon: "home-sell",
    title: "Sell a property",
    copy: "Get the best value for your property, with the paperwork taken care of.",
    points: [
      "Free Property Evaluation",
      "Wide Marketing Exposure",
      "Genuine Buyers Network",
      "Hassle-free Documentation",
      "Quick & Secure Transactions",
    ],
    cta: { label: "Contact us", href: "/contact" },
  },
  {
    key: "rent",
    icon: "home-rent",
    title: "Rent a property",
    copy: "Hassle-free rental solutions tailored to what you actually need.",
    points: [
      "Verified Tenants & Owners",
      "Rental Agreements Drafted",
      "Rent Collection Support",
      "Periodic Maintenance",
      "Renewal Management",
    ],
    cta: { label: "Find a rental", href: "/rent" },
  },
];

export const propertyTypes = [
  { slug: "plot", label: "Plot" },
  { slug: "villa", label: "Villa" },
  { slug: "apartment", label: "Flat/Apartment" },
  { slug: "independent-house", label: "Independent House" },
  { slug: "commercial-space", label: "Commercial Space" },
  { slug: "farm-house-land", label: "Farm House/Land" },
];

export const propertyLabels = [
  { slug: "residential", label: "Residential" },
  { slug: "commercial", label: "Commercial" },
];

export const typeLabel = (slug) =>
  propertyTypes.find((type) => type.slug === slug)?.label || slug;

export default brand;
