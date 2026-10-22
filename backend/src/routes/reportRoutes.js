import express from "express";
import { store } from "../data/store.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json(store.reports);
});

router.patch("/:id/status", (req, res) => {
  const reportId = Number(req.params.id);
  const report = store.reports.find((item) => item.id === reportId);

  if (!report) {
    return res.status(404).json({ error: "report not found" });
  }

  if (!["open", "reviewing", "resolved"].includes(req.body.status)) {
    return res.status(400).json({ error: "invalid report status" });
  }

  report.status = req.body.status;
  res.json(report);
});

export default router;