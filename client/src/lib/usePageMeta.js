import { useEffect } from "react";

const setTag = (selector, attribute, value) => {
  if (!value) return;
  const node = document.head.querySelector(selector);
  if (node) node.setAttribute(attribute, value);
};

// Client-side title/meta for in-app navigation. Crawlers and WhatsApp are served the
// real tags by the server (see shared/meta.js) — this keeps the browser tab honest.
export const usePageMeta = ({ title, description, image, canonical }) => {
  useEffect(() => {
    if (title) {
      document.title = title;
      setTag('meta[property="og:title"]', "content", title);
      setTag('meta[name="twitter:title"]', "content", title);
    }
    if (description) {
      setTag('meta[name="description"]', "content", description);
      setTag('meta[property="og:description"]', "content", description);
      setTag('meta[name="twitter:description"]', "content", description);
    }
    if (image) {
      setTag('meta[property="og:image"]', "content", image);
      setTag('meta[name="twitter:image"]', "content", image);
    }

    const href = canonical || window.location.href.split("?")[0];
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = href;
    setTag('meta[property="og:url"]', "content", href);
  }, [title, description, image, canonical]);
};
