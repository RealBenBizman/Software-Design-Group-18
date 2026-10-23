import express from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { getUserNotifications, markNotificationRead } from "../services/notificationService.js";

const router = express.Router();
router.use(requireAuth, requireRole("student"));

router.get("/", (req, res) => {
  res.json(getUserNotifications(req.user.id));
});

router.patch("/:id/read", (req, res) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
    return res.status(400).json({ error: "invalid notification id" });
  }

  const notification = markNotificationRead(req.user.id, req.params.id);
  if (!notification) {
    return res.status(404).json({ error: "notification not found" });
  }
  res.json(notification);
});

export default router;
