// Share previews. WhatsApp, Facebook and Instagram never execute JavaScript, so a React SPA
// that sets its <head> at runtime shows a generic card for every listing. We rewrite the
// static HTML between the <!--meta--> markers before serving it.

import { isPriceOnRequest, priceText as priceLine } from "../shared/money.js";
import { defaultPropertyImage } from "../shared/propertyImages.js";

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const renderMetaTags = (property, { origin, siteName }) => {
  const url = `${origin}/real-estate/${property.slug}`;
  const imagePath = property.images?.[0] || defaultPropertyImage(property.propertyType);
  const image = imagePath.startsWith("http") ? imagePath : `${origin}${imagePath}`;

  const title = `${property.title} — ${priceLine(property)} | ${siteName}`;
  const description =
    (property.description || "").slice(0, 200) ||
    `${property.title} in ${property.locationText}. ${priceLine(property)}.`;

  // A withheld price must not reappear in structured data or the OG tags.
  const onRequest = isPriceOnRequest(property);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    url,
    image,
    description,
    datePosted: property.createdAt,
    offers: {
      "@type": "Offer",
      ...(onRequest ? {} : { price: property.price }),
      priceCurrency: "INR",
      availability:
        property.status === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: property.locality || undefined,
      addressLocality: property.city,
      addressRegion: property.state,
      postalCode: property.pincode || undefined,
      addressCountry: "IN",
    },
  };

  if (property.areaSqft) {
    jsonLd.floorSize = { "@type": "QuantitativeValue", value: property.areaSqft, unitCode: "FTK" };
  }
  if (property.bedrooms) jsonLd.numberOfBedrooms = property.bedrooms;
  if (property.bathrooms) jsonLd.numberOfBathroomsTotal = property.bathrooms;

  return `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(url)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="${escapeHtml(siteName)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    ${
      onRequest
        ? ""
        : `<meta property="product:price:amount" content="${escapeHtml(property.price)}" />
    <meta property="product:price:currency" content="INR" />`
    }
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  `.trim();
};

// Replaces everything between the <!--meta--> and <!--/meta--> markers in index.html.
export const injectMeta = (html, tags) =>
  html.replace(/<!--meta-->[\s\S]*?<!--\/meta-->/, `<!--meta-->\n${tags}\n    <!--/meta-->`);
