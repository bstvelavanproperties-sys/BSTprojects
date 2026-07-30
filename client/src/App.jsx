import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Preloader from "./components/Preloader.jsx";
import CompareProvider from "./context/CompareProvider.jsx";
import Home from "./pages/Home.jsx";
import Listings from "./pages/Listings.jsx";
import PropertyDetail from "./pages/PropertyDetail.jsx";
import Matchmaker from "./pages/Matchmaker.jsx";
import Affordability from "./pages/Affordability.jsx";
import Services from "./pages/Services.jsx";
import PropertyWanted from "./pages/PropertyWanted.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Faqs from "./pages/Faqs.jsx";
import NotFound from "./pages/NotFound.jsx";

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
