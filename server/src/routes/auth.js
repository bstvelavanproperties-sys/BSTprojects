import { Router } from "express";

import { tokenConfigured } from "../config/env.js";
import {
  clearLoginAttempts,
  credentialsConfigured,
  isAuthenticated,
  issueSession,
  loginBlocked,
  recordFailedLogin,
  verifyCredentials,
} from "../middleware/auth.js";

const router = Router();

router.get("/session", (request, response) => {
  const configured = credentialsConfigured();

  // Mirrors requireAdmin exactly, including its dev-only open case — they share one
  // isAuthenticated() now. The old version reported `authenticated: true` to
  // anonymous callers whenever username/password were unset, which with only
  // ADMIN_TOKEN configured meant the admin UI rendered for any visitor. It could not
  // actually write anything, but presenting the panel at all is a disclosure with no
  // upside.
  const authenticated = isAuthenticated(request);

  return response.json({
    configured: configured || tokenConfigured,
    authenticated,
    // Only echoed back to someone already signed in — handing the username to an
    // anonymous caller would leave only the password to guess.
    username: configured && authenticated ? process.env.ADMIN_USERNAME : "",
  });
});

router.post("/login", (request, response) => {
  const ip = request.ip || "unknown";

  if (!credentialsConfigured()) {
    return response.status(503).json({ error: "Admin login is not configured on the server." });
  }
  if (loginBlocked(ip)) {
    return response
      .status(429)
      .json({ error: "Too many failed attempts. Try again in 15 minutes." });
  }

  const { username, password } = request.body || {};
  if (!verifyCredentials(username, password)) {
    recordFailedLogin(ip);
    // One message for both cases — naming which half was wrong confirms a username.
    return response.status(401).json({ error: "Incorrect username or password." });
  }

  clearLoginAttempts(ip);
  return response.json(issueSession());
});

export default router;
