import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { track } from "./storage.js";

const KEY = "bstv-compare";
const MAX = 3;

const CompareContext = createContext(null);

const save = (next) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota or private mode — non-fatal */
  }
  return next;
};

export function CompareProvider({ children }) {
  const [slugs, setSlugs] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY));
      if (Array.isArray(stored)) setSlugs(stored.slice(0, MAX));
    } catch {
      /* ignore */
    }
  }, []);

  // Derives from the current `slugs` rather than a setState updater, so the caller can
  // act on the result synchronously (the toggle shows a "Max 3" hint when full).
  const toggle = useCallback(
    (slug) => {
      if (slugs.includes(slug)) {
        setSlugs(save(slugs.filter((item) => item !== slug)));
        return true;
      }
      if (slugs.length >= MAX) return false;
      setSlugs(save([...slugs, slug]));
      track("compare_add", { slug });
      return true;
    },
    [slugs],
  );

  const remove = useCallback(
    (slug) => setSlugs(save(slugs.filter((item) => item !== slug))),
    [slugs],
  );

  const clear = useCallback(() => {
    setSlugs(save([]));
    setOpen(false);
  }, []);

  const has = useCallback((slug) => slugs.includes(slug), [slugs]);

  const value = useMemo(
    () => ({ slugs, toggle, remove, clear, has, open, setOpen, max: MAX }),
    [slugs, toggle, remove, clear, has, open],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) throw new Error("useCompare must be used inside CompareProvider");
  return context;
};
