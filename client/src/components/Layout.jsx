import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import WhatsAppFab from "./WhatsAppFab.jsx";
import ScrollTopFab from "./ScrollTopFab.jsx";
import CompareBar from "./CompareBar.jsx";
import ComparePanel from "./ComparePanel.jsx";
import { track } from "../lib/storage.js";

// The chrome every public route renders inside. Extracted from App.jsx, which now
// holds nothing but the route table.
export default function Layout() {
  const location = useLocation();

  useEffect(() => {
    track("page_view", { path: location.pathname });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only-focusable absolute left-4 top-4 z-[70] rounded-lg bg-brand-500 px-4 py-2 font-bold text-white"
      >
        Skip to content
      </a>

      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />

      <WhatsAppFab />
      <ScrollTopFab />
      <CompareBar />
      <ComparePanel />
    </div>
  );
}
