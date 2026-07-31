import {
  Bank,
  Building,
  Doc,
  Home,
  LandPlot,
  Rupee,
  Shield,
  Thumb,
  Tools,
  Trees,
  Users,
  Villa,
} from "./Icons.jsx";

// Split out of Icons.jsx so that file exports only components: mixing lookup tables
// in with them breaks Vite's react-refresh boundary for every icon consumer.
// Keys are the `icon` strings used in config/brand.js.
export const iconMap = {
  shield: Shield,
  users: Users,
  doc: Doc,
  thumb: Thumb,
  building: Building,
  rupee: Rupee,
  tools: Tools,
  bank: Bank,
  "home-buy": Home,
  "home-sell": Building,
  "home-rent": Home,
};

// One icon per property type, so the category carousel isn't six identical tiles.
export const propertyTypeIcons = {
  plot: LandPlot,
  villa: Villa,
  apartment: Building,
  "independent-house": Home,
  "commercial-space": Building,
  "farm-house-land": Trees,
};
