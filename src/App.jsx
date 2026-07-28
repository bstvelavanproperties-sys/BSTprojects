import { useEffect } from "react";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Preloader from "./components/Preloader.jsx";
import { ScrollTopFab, WhatsAppFab } from "./components/Fabs.jsx";
import { CompareBar, ComparePanel } from "./components/Compare.jsx";
import { CompareProvider } from "./lib/CompareContext.jsx";
import Home from "./pages/Home.jsx";
import Listings from "./pages/Listings.jsx";
import PropertyDetail from "./pages/PropertyDetail.jsx";
import Matchmaker from "./pages/Matchmaker.jsx";
import Affordability from "./pages/Affordability.jsx";
import { About, Contact, Faqs, NotFound, PropertyWanted, Services } from "./pages/Static.jsx";
import { track } from "./lib/storage.js";

function Layout() {
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

export default function App() {
  return (
    <CompareProvider>
      <Preloader />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="properties" element={<Listings heading="All Properties" />} />
          <Route
            path="buy"
            element={<Listings fixedListingType="sale" heading="Properties for Sale" />}
          />
          <Route
            path="rent"
            element={<Listings fixedListingType="rent" heading="Properties for Rent" />}
          />
          <Route path="real-estate/:slug" element={<PropertyDetail />} />
          <Route path="find-my-property" element={<Matchmaker />} />
          <Route path="affordability" element={<Affordability />} />
          <Route path="services" element={<Services />} />
          <Route path="property-wanted" element={<PropertyWanted />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="faqs" element={<Faqs />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </CompareProvider>
  );
}
