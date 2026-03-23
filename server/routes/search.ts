import { Router } from "express";
import * as searchService from "../services/searchService";

const router = Router();

router.get("/", async (req, res) => {
  const q = String(req.query.q || "");
  const results = await searchService.search(q);
  res.json(results);
});

export default router;
