// Every brand value the site renders lives here. Nothing else hardcodes a brand string.
// Values marked TODO were not in the supplied flyer — fill them in and the whole site updates.

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

  // TODO — not supplied in the flyer.
  emails: ["info@bstvelavanproperties.com"],
  offices: {
    head: {
      label: "Head office",
      lines: ["TODO — head office address", "Chennai, Tamil Nadu"],
    },
    branch: {
      label: "Branch office",
      lines: ["TODO — branch office address"],
    },
  },
  socials: {
    youtube: "",
    facebook: "",
    instagram: "",
  },

  // TODO — replace with the supplied red "Vel" mark. Drop the file at
  // public/assets/logo.png and change this one line.
  logo: "/assets/logo.svg",
  origin: "https://bstvelavanproperties.com",
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
