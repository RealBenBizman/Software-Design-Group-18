import express from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { getUserHistory, HISTORY_OUTCOMES } from "../services/historyService.js";

const router = express.Router();
router.use(requireAuth, requireRole("student"));

router.get("/", (req, res) => {
  const { outcome } = req.query;
  if (outcome !== undefined && !HISTORY_OUTCOMES.includes(outcome)) {
    return res.status(400).json({ error: "invalid history outcome filter" });
  }
  res.json(getUserHistory(req.user.id, outcome));
});

export default router;
