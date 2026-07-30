const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const Svg = ({ children, size = 20, className = "", filled = false, ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...(filled ? { fill: "currentColor" } : base)}
    {...rest}
  >
    {children}
  </svg>
);

export const Search = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);

export const MapPin = (p) => (
  <Svg {...p}>
    <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </Svg>
);

export const Home = (p) => (
  <Svg {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5.5 9.5V20h13V9.5" />
  </Svg>
);

export const Sliders = (p) => (
  <Svg {...p}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </Svg>
);

export const Phone = (p) => (
  <Svg {...p}>
    <path d="M4.5 4.5h3.2l1.6 4-2 1.4a12 12 0 0 0 5.3 5.3l1.4-2 4 1.6v3.2a1.5 1.5 0 0 1-1.7 1.5A16.5 16.5 0 0 1 3 6.2 1.5 1.5 0 0 1 4.5 4.5Z" />
  </Svg>
);

export const Mail = (p) => (
  <Svg {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="m4 7 8 5.5L20 7" />
  </Svg>
);

export const Play = (p) => (
  <Svg {...p}>
    <path d="M8 5.5v13l11-6.5z" />
  </Svg>
);

export const Film = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M7 5v14M17 5v14M3 12h18" />
  </Svg>
);

export const ChevronRight = (p) => (
  <Svg {...p}>
    <path d="m9.5 5 7 7-7 7" />
  </Svg>
);

export const ChevronLeft = (p) => (
  <Svg {...p}>
    <path d="m14.5 5-7 7 7 7" />
  </Svg>
);

export const ChevronDown = (p) => (
  <Svg {...p}>
    <path d="m5 9 7 7 7-7" />
  </Svg>
);

export const ArrowRight = (p) => (
  <Svg {...p}>
    <path d="M4 12h15" />
    <path d="m13 6 6 6-6 6" />
  </Svg>
);

export const ArrowUp = (p) => (
  <Svg {...p}>
    <path d="M12 20V5" />
    <path d="m6 11 6-6 6 6" />
  </Svg>
);

export const Close = (p) => (
  <Svg {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
);

export const Menu = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const Bed = (p) => (
  <Svg {...p}>
    <path d="M3 18v-6h18v6" />
    <path d="M3 12V7M21 18v-2" />
    <path d="M7 12V9.5h4.5V12" />
  </Svg>
);

export const Bath = (p) => (
  <Svg {...p}>
    <path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3Z" />
    <path d="M7 12V6.5A2 2 0 0 1 10.5 5" />
  </Svg>
);

export const Ruler = (p) => (
  <Svg {...p}>
    <rect x="3" y="8" width="18" height="8" rx="2" />
    <path d="M7.5 8v3M12 8v4M16.5 8v3" />
  </Svg>
);

export const Shield = (p) => (
  <Svg {...p}>
    <path d="M12 3 5 6v6c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

export const Users = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="9" r="3" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <path d="M16 6.5a3 3 0 0 1 0 5.8M17 19a5.4 5.4 0 0 0-2-4.2" />
  </Svg>
);

export const Doc = (p) => (
  <Svg {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </Svg>
);

export const Thumb = (p) => (
  <Svg {...p}>
    <path d="M7 21V10l4.5-7 1.2.6a2.5 2.5 0 0 1 1.2 3L13 10h4.8a2.5 2.5 0 0 1 2.4 3.1l-1.4 6A2.5 2.5 0 0 1 16.4 21H7Z" />
    <path d="M7 10H4v11h3" />
  </Svg>
);

export const Building = (p) => (
  <Svg {...p}>
    <rect x="4" y="3" width="10" height="18" rx="1.5" />
    <path d="M14 9h6v12h-6" />
    <path d="M7 7h4M7 11h4M7 15h4M17 13h1M17 17h1" />
  </Svg>
);

export const Rupee = (p) => (
  <Svg {...p}>
    <path d="M7 4h10M7 9h10M16 4c0 4-3.5 5-6.5 5H7l7 11" />
  </Svg>
);

export const Tools = (p) => (
  <Svg {...p}>
    <path d="M14.5 6.5a3.5 3.5 0 0 0 4.6 4.6L21 13l-8 8-2-2 1.9-1.9a3.5 3.5 0 0 0-4.6-4.6L6.5 11 3 7.5 6.5 4l3.5 3.5Z" />
  </Svg>
);

export const Star = ({ size = 18, className = "" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden="true">
    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />
  </svg>
);

export const Heart = ({ filled, ...p }) => (
  <Svg {...p} {...(filled ? { fill: "currentColor" } : {})}>
    <path d="M12 20s-7-4.5-7-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.6C19 15.5 12 20 12 20Z" />
  </Svg>
);

export const Share = (p) => (
  <Svg {...p}>
    <circle cx="18" cy="5.5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="18.5" r="2.5" />
    <path d="m8.2 10.8 7.6-4M8.2 13.2l7.6 4" />
  </Svg>
);

export const WhatsApp = ({ size = 22, className = "" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.8-.6-3-1.3-5-4.4-5.2-4.6-.2-.2-1.3-1.7-1.3-3.2s.8-2.3 1-2.6c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2 1.3 2.3 1.5.3.1.5.1.6-.1l.9-1c.2-.2.4-.2.6-.1l2 1c.2.1.4.2.4.3.1.1.1.6-.1 1.3Z" />
  </svg>
);

export const Facebook = ({ size = 20, className = "" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden="true">
    <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.6c-.3 0-1.3-.1-2.45-.1-2.4 0-4.05 1.5-4.05 4.2v2.2H7.5V13h2.7v8h3.3Z" />
  </svg>
);

export const Instagram = ({ size = 20, className = "" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 1.8.25 2.2.42.6.22 1 .48 1.4.9.42.4.68.8.9 1.4.17.4.36 1 .42 2.2.07 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.06 1.2-.25 1.8-.42 2.2-.22.6-.48 1-.9 1.4-.4.42-.8.68-1.4.9-.4.17-1 .36-2.2.42-1.3.07-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.06-1.8-.25-2.2-.42-.6-.22-1-.48-1.4-.9-.42-.4-.68-.8-.9-1.4-.17-.4-.36-1-.42-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.06-1.2.25-1.8.42-2.2.22-.6.48-1 .9-1.4.4-.42.8-.68 1.4-.9.4-.17 1-.36 2.2-.42C8.4 2.2 8.8 2.2 12 2.2Zm0 3.3a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 10.72a4.22 4.22 0 1 1 0-8.44 4.22 4.22 0 0 1 0 8.44Zm6.75-10.97a1.52 1.52 0 1 1-3.04 0 1.52 1.52 0 0 1 3.04 0Z" />
  </svg>
);

export const YouTube = ({ size = 22, className = "" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden="true">
    <path d="M21.6 7.2a2.5 2.5 0 0 0-1.75-1.77C18.25 5 12 5 12 5s-6.25 0-7.85.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.75 1.77C5.75 19 12 19 12 19s6.25 0 7.85-.43a2.5 2.5 0 0 0 1.75-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3-5.2 3Z" />
  </svg>
);

export const Chat = ({ size = 26, className = "" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 3c5 0 9 3.4 9 7.6 0 4.2-4 7.6-9 7.6a10 10 0 0 1-2.6-.34L5 20l.9-3.2A7.3 7.3 0 0 1 3 10.6C3 6.4 7 3 12 3Z" />
  </svg>
);

export const Trees = (p) => (
  <Svg {...p}>
    <path d="M9 20v-4M9 16 5.5 11h2L5 7h8l-2.5 4h2L9 16Z" />
    <path d="M17 20v-5M17 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
  </Svg>
);

export const LandPlot = (p) => (
  <Svg {...p}>
    <path d="M4 8h16v11H4z" strokeDasharray="4 3" />
    <path d="M4 8 8 4h12l-4 4" />
    <circle cx="4" cy="8" r="1.2" fill="currentColor" />
    <circle cx="20" cy="8" r="1.2" fill="currentColor" />
    <circle cx="4" cy="19" r="1.2" fill="currentColor" />
    <circle cx="20" cy="19" r="1.2" fill="currentColor" />
  </Svg>
);

export const Villa = (p) => (
  <Svg {...p}>
    <path d="M3 12 8 8l5 4v9H3z" />
    <path d="M13 21v-7l4-3 4 3v7" />
    <path d="M6 16h4M16 16h2" />
  </Svg>
);
