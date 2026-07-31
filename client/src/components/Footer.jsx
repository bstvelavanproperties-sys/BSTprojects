import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import brand, { propertyTypes } from "../config/brand.js";
import { fetchCities } from "../lib/api.js";
import { ChevronRight, Facebook, Instagram, Mail, Phone, YouTube } from "./Icons.jsx";

const companyLinks = [
  { to: "/", label: "Home" },
  { to: "/properties", label: "All Properties" },
  { to: "/find-my-property", label: "Find My Property" },
  { to: "/affordability", label: "What Can I Afford?" },
  { to: "/property-wanted", label: "Property Wanted" },
  { to: "/nri", label: "NRI Corner" },
  { to: "/services", label: "Services" },
  { to: "/faqs", label: "FAQs" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact Us" },
];

const FooterLink = ({ to, children }) => (
  <li>
    <Link
      to={to}
      className="group inline-flex items-center gap-1.5 py-1 text-sm text-white/70 transition-colors hover:text-white"
    >
      <ChevronRight size={14} className="text-brand-500" />
      {children}
    </Link>
  </li>
);

export default function Footer() {
  const [cities, setCities] = useState([]);

  useEffect(() => {
    fetchCities()
      .then((rows) => setCities(rows.slice(0, 7)))
      .catch(() => setCities([]));
  }, []);

  const socials = [
    { key: "youtube", Icon: YouTube, href: brand.socials.youtube, label: "YouTube" },
    { key: "facebook", Icon: Facebook, href: brand.socials.facebook, label: "Facebook" },
    { key: "instagram", Icon: Instagram, href: brand.socials.instagram, label: "Instagram" },
  ].filter((item) => item.href);

  return (
    <footer className="bg-navy-900 text-white">
      <div className="container-page grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="mb-5 text-lg font-extrabold text-white">Office Address</h3>
          {Object.values(brand.offices).map((office) => (
            <div key={office.label} className="mb-5 last:mb-0">
              <p className="mb-1 text-sm text-white/50">{office.label}:</p>
              {office.lines.map((line) => (
                <p key={line} className="text-sm font-semibold leading-relaxed text-white/85">
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div>
          <h3 className="mb-5 text-lg font-extrabold text-white">Contact Information</h3>
          <div className="mb-5 flex gap-3">
            <Phone size={22} className="mt-0.5 shrink-0 text-brand-500" />
            <div>
              <p className="mb-1 text-sm text-white/50">Contact Number:</p>
              {brand.phones.map((phone) => (
                <a
                  key={phone}
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="block text-sm font-semibold text-white/85 hover:text-white"
                >
                  {phone}
                </a>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Mail size={22} className="mt-0.5 shrink-0 text-brand-500" />
            <div>
              <p className="mb-1 text-sm text-white/50">Email:</p>
              {brand.emails.map((email) => (
                <a
                  key={email}
                  href={`mailto:${email}`}
                  className="block text-sm font-semibold break-all text-white/85 hover:text-white"
                >
                  {email}
                </a>
              ))}
            </div>
          </div>

          {socials.length > 0 && (
            <div className="mt-6 flex items-center gap-4">
              {socials.map(({ key, Icon, href, label }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  className="text-white/70 transition-colors hover:text-brand-500"
                >
                  <Icon size={22} />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-5 text-lg font-extrabold text-white">Our Company</h3>
          <ul>
            {companyLinks.map((link) => (
              <FooterLink key={link.to} to={link.to}>
                {link.label}
              </FooterLink>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-5 text-lg font-extrabold text-white">
            {cities.length ? "Properties by City" : "Property Types"}
          </h3>
          <ul>
            {cities.length
              ? cities.map((row) => (
                  <FooterLink key={row.city} to={`/properties?city=${encodeURIComponent(row.city)}`}>
                    {row.city} <span className="text-white/40">({row.count})</span>
                  </FooterLink>
                ))
              : propertyTypes.map((type) => (
                  <FooterLink key={type.slug} to={`/properties?propertyType=${type.slug}`}>
                    {type.label}
                  </FooterLink>
                ))}
          </ul>
        </div>
      </div>

      {/* Bottom strip mirrors the brand flyer. */}
      <div className="border-t border-white/10 bg-brand-500">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-center text-[13px] font-bold text-white sm:flex-row sm:text-left">
          <p>Residential | Commercial | Plots | Villas | Apartments</p>
          <p className="text-gold-500">{brand.tagline}</p>
          <p>{brand.slogans.professional}</p>
        </div>
      </div>

      <div className="bg-navy-900 py-4 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {brand.legalName}. All rights reserved.
      </div>
    </footer>
  );
}
