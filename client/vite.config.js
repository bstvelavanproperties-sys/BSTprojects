import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The config sits next to the app it builds, so `root` stays at its default (this
// directory). Shared code is reached through the @bstv/shared package rather than a
// path that climbs out of the project, so no fs.allow escape hatch is needed either.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export default defineConfig({
  // One .env for the whole repo, because the API reads the same file. Without this
  // Vite would look inside client/, find nothing, and every VITE_* var would be
  // undefined at build time — an empty bundle var, not an error.
  envDir: repoRoot,

  plugins: [react(), tailwindcss()],

  build: {
    // Vercel's Root Directory is this folder, so dist/ lands where it expects
    // (client/vercel.json sets outputDirectory to "dist").
    outDir: "dist",
    emptyOutDir: true,
  },

  server: {
    port: 5173,
    // Fail instead of sliding to 5174 when 5173 is busy: a second dev server on
    // a surprise port is always a stale process, and the extra URL sends you to
    // an app that isn't the one you're editing.
    strictPort: true,
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});
