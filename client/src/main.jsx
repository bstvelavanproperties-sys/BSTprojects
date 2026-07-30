import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App.jsx";
import "./styles.css";

// Split out of the main bundle. pages/Admin.jsx is the single largest module in the
// app (~1,000 lines, plus the CSV parser and the Cloudinary uploader) and it was being
// statically imported, so every public visitor downloaded the entire admin panel to
// render the homepage. The API is what actually guards admin data — this is about
// payload size and not publishing the admin surface to people who cannot use it.
const AdminApp = lazy(() => import("./pages/Admin.jsx"));

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (measurementId?.startsWith("G-")) {
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args) => window.dataLayer.push(args);
  window.gtag("js", new Date());
  window.gtag("config", measurementId);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<div className="p-10 text-center text-muted">Loading…</div>}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
