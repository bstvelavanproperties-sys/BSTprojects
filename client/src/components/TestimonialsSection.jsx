import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import brand from "../config/brand.js";
import { fetchReviews } from "../lib/api.js";
import { ChevronLeft, ChevronRight, Search, Star } from "./Icons.jsx";

// 9. Testimonials
export default function TestimonialsSection() {
  const [reviews, setReviews] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetchReviews()
      .then(setReviews)
      .catch(() => setReviews([]));
  }, []);

  if (!reviews.length) return null;

  const review = reviews[index];
  const move = (step) => setIndex((current) => (current + step + reviews.length) % reviews.length);

  // Derived from the reviews actually present — never a fabricated total.
  const average = reviews.reduce((sum, item) => sum + (item.rating || 0), 0) / reviews.length;
  const ratingWord = average >= 4.5 ? "EXCELLENT" : average >= 3.5 ? "GREAT" : "GOOD";

  return (
    <section className="bg-surface py-20">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="h-section mb-4 text-left">Voices of Our Valued Clients</h2>
          <p className="mb-8 max-w-lg text-base leading-relaxed text-muted">
            Read the stories of clients who have found success with {brand.name}, and the care we put
            into every transaction.
          </p>

          <div className="card p-7">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-lg font-extrabold text-navy-700">{ratingWord} rating</p>
                <p className="text-sm text-muted">
                  {average.toFixed(1)} average from {reviews.length}{" "}
                  {reviews.length === 1 ? "review" : "reviews"}
                </p>
              </div>
              <div
                className="flex gap-0.5 text-gold-500"
                aria-label={`${review.rating} out of 5 stars`}
              >
                {Array.from({ length: 5 }, (_, star) => (
                  <Star
                    key={star}
                    size={20}
                    className={star < review.rating ? "" : "text-gray-200"}
                  />
                ))}
              </div>
            </div>

            <blockquote className="min-h-28 text-[15px] leading-relaxed text-muted">
              “{review.text}”
            </blockquote>

            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-extrabold text-white">
                  {review.name.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-extrabold text-navy-700">{review.name}</p>
                  <p className="text-xs text-muted">{review.when}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => move(-1)}
                  aria-label="Previous review"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-navy-700 hover:border-brand-500 hover:text-brand-500"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => move(1)}
                  aria-label="Next review"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-navy-700 hover:border-brand-500 hover:text-brand-500"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-8">
          <img
            src="/assets/keys.svg"
            alt=""
            className="w-full max-w-md"
            loading="lazy"
          />
          <Link to="/properties" className="btn-brand">
            <Search size={18} />
            Find your wonderful home
          </Link>
        </div>
      </div>
    </section>
  );
}
