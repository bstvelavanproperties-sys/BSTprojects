// Kills leftover dev servers holding the two ports `npm run dev` needs, so the
// client always comes up on 5173 and the API on 5000. Runs automatically as
// npm's `predev` hook.
//
// Without this, an orphaned run from a closed terminal keeps its port and Vite
// either moves to 5174 (two links, and you debug the stale one) or — with
// server.strictPort set — refuses to boot at all.
import { execFileSync } from "node:child_process";

// 5173 matches server.port in vite.config.js; 5000 matches the fallback in
// server/src/server.js, which honours PORT from .env.
const ports = [5173, Number(process.env.PORT) || 5000];

// lsof over `kill $(...)`: we need the pid list in JS to report what died and to
// escalate to SIGKILL only for the ones that ignore SIGTERM.
const listenersOn = (port) => {
  try {
    return execFileSync("lsof", ["-ti", `tcp:${port}`, "-sTCP:LISTEN"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split("\n")
      .map((line) => Number(line.trim()))
      // Never target ourselves or the npm parent that invoked us.
      .filter((pid) => pid && pid !== process.pid && pid !== process.ppid);
  } catch {
    // lsof exits 1 when nothing matches — that's the common case, not an error.
    return [];
  }
};

const describe = (pid) => {
  try {
    return execFileSync("ps", ["-o", "command=", "-p", String(pid)], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown process";
  }
};

const sleep = (ms) => {
  // Synchronous by design: the dev server must not start until the port is
  // actually released, and a bare script has no await at top level worth the
  // ceremony here.
  const until = Date.now() + ms;
  while (Date.now() < until) {
    // spin
  }
};

const signal = (pids, sig) => {
  for (const pid of pids) {
    try {
      process.kill(pid, sig);
    } catch {
      // Already gone between the lsof and the kill — nothing to do.
    }
  }
};

for (const port of ports) {
  const pids = listenersOn(port);
  if (pids.length === 0) continue;

  for (const pid of pids) {
    console.log(`Port ${port} held by pid ${pid}: ${describe(pid)}`);
  }

  signal(pids, "SIGTERM");

  // Give the socket a moment to close, then escalate for anything still bound.
  let remaining = [];
  for (let attempt = 0; attempt < 20; attempt += 1) {
    sleep(100);
    remaining = listenersOn(port);
    if (remaining.length === 0) break;
  }

  if (remaining.length > 0) {
    signal(remaining, "SIGKILL");
    sleep(300);
    remaining = listenersOn(port);
  }

  if (remaining.length > 0) {
    console.error(
      `Could not free port ${port} (pid ${remaining.join(", ")}). ` +
        `Stop that process manually, or set PORT to something else.`,
    );
    process.exit(1);
  }

  console.log(`Freed port ${port}.`);
}
