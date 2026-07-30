import { Router } from "express";

import { live } from "../lib/memory.js";

const router = Router();

router.get("/", (_request, response) => {
  response.json({ ok: true, database: live() ? "connected" : "memory-mode" });
});

export default router;
