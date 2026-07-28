import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import brand, { propertyTypes } from "../data/brand.js";
import { ChevronDown, Facebook, Home, Instagram, Menu, Close, YouTube } from "./Icons.jsx";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/buy", label: "Buy", dropdown: "sale" },
  { to: "/rent", label: "Rent", dropdown: "rent" },
  { to: "/properties", label: "All Properties" },
  { to: "/find-my-property", label: "Find My Property", highlight: true },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact Us" },
];

const linkClass = ({ isActive }) =>
  `text-[15px] font-bold transition-colors ${
    isActive ? "text-brand-500" : "text-navy-700 hover:text-brand-500"
  }`;

export default function Header() {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(null);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    setMenu(null);
  }, [location.pathname, location.search]);

  const socials = [
    { key: "youtube", Icon: YouTube, href: brand.socials.youtube, label: "YouTube" },
    { key: "facebook", Icon: Facebook, href: brand.socials.facebook, label: "Facebook" },
    { key: "instagram", Icon: Instagram, href: brand.socials.instagram, label: "Instagram" },
  ].filter((item) => item.href);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white">
      <div className="container-page flex h-20 items-center justify-between gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <img
            src={brand.logo}
            alt=""
            className="h-11 w-11 rounded-full object-contain"
            width="44"
            height="44"
          />
          <span className="leading-tight">
            <span className="block text-lg font-extrabold text-navy-700 sm:text-xl">
              {brand.shortName}
            </span>
            <span className="block text-[11px] font-semibold tracking-wide text-muted">
              Properties
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 xl:flex" aria-label="Primary">
          {navItems.map((item) =>
            item.dropdown ? (
              <div
                key={item.to}
                className="relative"
                onMouseEnter={() => setMenu(item.to)}
                onMouseLeave={() => setMenu(null)}
              >
                <NavLink to={item.to} className={linkClass}>
                  <span className="inline-flex items-center gap-1">
                    {item.label}
                    <ChevronDown size={15} />
                  </span>
                </NavLink>

                {menu === item.to && (
                  <div className="absolute left-1/2 top-full w-60 -translate-x-1/2 pt-3">
                    <ul className="card overflow-hidden py-2">
                      {propertyTypes.map((type) => (
                        <li key={type.slug}>
                          <Link
                            to={`/properties?listingType=${item.dropdown}&propertyType=${type.slug}`}
                            className="block px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-brand-50 hover:text-brand-500"
                          >
                            {type.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <NavLink key={item.to} to={item.to} className={linkClass} end={item.to === "/"}>
                {item.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="flex items-center gap-4">
          {socials.length > 0 && (
            <div className="hidden items-center gap-3 text-navy-700 lg:flex">
              {socials.map(({ key, Icon, href, label }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  className="transition-colors hover:text-brand-500"
                >
                  <Icon />
                </a>
              ))}
            </div>
          )}

          <Link to="/property-wanted" className="btn-brand hidden shrink-0 sm:inline-flex">
            <Home size={18} />
            Property Wanted
          </Link>

          <button
            type="button"
            className="text-navy-700 xl:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <Close size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 bg-white xl:hidden">
          <nav className="container-page flex flex-col py-3" aria-label="Mobile">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `border-b border-gray-50 py-3.5 text-[15px] font-bold ${
                    isActive ? "text-brand-500" : "text-navy-700"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link to="/property-wanted" className="btn-brand mt-4 mb-2">
              <Home size={18} />
              Property Wanted
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
