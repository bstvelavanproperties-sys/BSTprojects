import { Link } from "react-router-dom";
import brand from "../config/brand.js";
import { usePageMeta } from "../lib/usePageMeta.js";

export default function NotFound() {
  usePageMeta({ title: `Page not found — ${brand.name}` });

  return (
    <div className="container-page py-28 text-center">
      <p className="mb-3 text-6xl font-extrabold text-brand-500">404</p>
      <h1 className="mb-3 text-3xl font-extrabold text-navy-700">Page not found</h1>
      <p className="mb-8 text-muted">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn-brand">
        Back to home
      </Link>
    </div>
  );
}
