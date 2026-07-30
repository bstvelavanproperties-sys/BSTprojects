import mongoose from "mongoose";

import { production as isProduction } from "../config/env.js";
import { properties as seedProperties, defaultContent } from "../data/properties.js";

// Is a real database attached and answering right now?
export const live = () => mongoose.connection.readyState === 1;

// ---------------------------------------------------------------------------
// In-memory fallback — DEVELOPMENT ONLY.
// ---------------------------------------------------------------------------
// This lets the whole site run with no database attached, which is genuinely
// useful locally. In production it was a trap: a failed Mongo connection silently
// swapped real inventory for 24 seed listings, and the site looked healthy while
// serving fiction. config/env.js now requires MONGODB_URI in production, and
// requireDatabase() turns any later disconnect into an honest 503.
//
// Exported as one object so routes can mutate its arrays (`memory.properties`,
// `memory.leads`) and reassign `memory.content` — rebinding a bare export would
// not propagate to importers.
export const memory = isProduction
  ? { properties: [], leads: [], content: { ...defaultContent } }
  : { properties: [...seedProperties], leads: [], content: { ...defaultContent } };
