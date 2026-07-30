// Lead-form throttle, per IP.
//
// Bounded, for the same reason as the login limiter in middleware/auth.js: the
// previous Map added an entry per source IP and never removed one, so a spray from a
// botnet grew it until the process ran out of memory. A fixed ceiling with eviction
// is the right trade — worst case some IPs get their quota reset, versus the API
// falling over.
//
// NOTE: in-memory and per-instance. Resets on deploy and does not add up across
// instances. Fine for one warm Render instance; scaling past one needs a shared store.
const rateLimit = new Map(); // ip -> timestamps
const LEAD_WINDOW_MS = 60 * 60 * 1000;
const MAX_LEADS_PER_WINDOW = 12;
const MAX_TRACKED_IPS = 10_000;

export const isRateLimited = (ip) => {
  const now = Date.now();

  if (!rateLimit.has(ip) && rateLimit.size >= MAX_TRACKED_IPS) {
    for (const [tracked, times] of rateLimit) {
      if (times.every((time) => now - time >= LEAD_WINDOW_MS)) rateLimit.delete(tracked);
    }
    // Everything still live means a genuine flood; drop oldest insertions first.
    if (rateLimit.size >= MAX_TRACKED_IPS) {
      const excess = rateLimit.size - MAX_TRACKED_IPS + 1;
      for (const tracked of [...rateLimit.keys()].slice(0, excess)) rateLimit.delete(tracked);
    }
  }

  const recent = (rateLimit.get(ip) || []).filter((time) => now - time < LEAD_WINDOW_MS);
  recent.push(now);
  // Slice so a single determined IP cannot grow an unbounded timestamp array either.
  rateLimit.set(ip, recent.slice(-(MAX_LEADS_PER_WINDOW + 1)));
  return recent.length > MAX_LEADS_PER_WINDOW;
};
