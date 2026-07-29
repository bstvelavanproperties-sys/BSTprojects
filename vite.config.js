import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The config stays at the repo root while the app lives in frontend/, so every
// path below is resolved from here rather than left relative — Vite resolves
// some options against `root` and others against the config file, and guessing
// wrong fails silently (see envDir).
const repoRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(repoRoot, "frontend"),

  // .env lives at the repo root because the API reads it too. Without this Vite
  // would look inside frontend/, find nothing, and every VITE_* var would be
  // undefined at build time — an empty bundle var, not an error.
  envDir: repoRoot,

  plugins: [react(), tailwindcss()],

  build: {
    // Kept at the repo root: Vercel serves dist/ and server/index.js falls back
    // to serving it when present. Moving it would break both.
    outDir: resolve(repoRoot, "dist"),
    emptyOutDir: true,
  },

  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5000",
    },
    fs: {
      // frontend/src imports ../../shared/*, which sits outside root.
      allow: [repoRoot],
    },
  },
});
