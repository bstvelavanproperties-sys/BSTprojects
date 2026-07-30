import { production as isProduction } from "../config/env.js";
import { live } from "../lib/memory.js";
import { fail } from "./errors.js";

// In production a lost database connection must read as an outage, not as an empty
// or seed-backed catalogue. Applied to every route that reads or writes inventory.
export const requireDatabase = (_request, response, next) => {
  if (!isProduction || live()) return next();
  return fail(response, 503, "The service is temporarily unavailable. Please try again shortly.");
};
