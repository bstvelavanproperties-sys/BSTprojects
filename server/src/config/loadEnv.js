// Loads the single .env at the repo root.
//
// Side-effect import — bring it in before anything that reads process.env.
//
// Plain `import "dotenv/config"` resolves .env from process.cwd(), and npm runs each
// workspace with the cwd set to that package (server/ here). With one shared .env at
// the repo root, every entry point has to say so explicitly or it silently loads
// nothing and the server boots as if the file were empty.
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

dotenv.config({ path: resolve(repoRoot, ".env") });
