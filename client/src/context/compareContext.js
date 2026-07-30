import { createContext, useContext } from "react";

// Split from CompareProvider.jsx so this module exports no components: Vite's
// react-refresh boundary (and the react-refresh/only-export-components lint rule)
// requires a file to be all-components or no-components. Mixing the two silently
// costs hot-module replacement for every consumer of the context.

export const MAX_COMPARE = 3;

export const CompareContext = createContext(null);

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) throw new Error("useCompare must be used inside CompareProvider");
  return context;
};
