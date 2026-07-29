export const DEFAULT_PROPERTY_IMAGES = Object.freeze({
  plot: "/assets/properties/plot-1.svg",
  villa: "/assets/properties/villa-1.svg",
  apartment: "/assets/properties/flat-1.svg",
  "independent-house": "/assets/properties/house-1.svg",
  "commercial-space": "/assets/properties/commercial-1.svg",
  "farm-house-land": "/assets/properties/farm-1.svg",
});

export const defaultPropertyImage = (propertyType) =>
  DEFAULT_PROPERTY_IMAGES[propertyType] || "/assets/properties/placeholder.svg";
