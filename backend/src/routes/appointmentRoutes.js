import express from "express";
import { store } from "../data/store.js";

import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { canManageService } from "../middleware/staffAccess.js";

const router = express.Router();
router.use(requireAuth, requireRole("admin", "employee"));

router.get("/", (req, res) => {
  const serviceId = req.query.serviceId
    ? Number(req.query.serviceId)
    : null;

  if (!serviceId) {
    return res.json(store.appointments);
  }

  const appointments = store.appointments.filter(
    (appointment) => appointment.serviceId === serviceId
  );

  res.json(appointments);
});

router.patch("/:id/status", (req, res) => {
  const appointmentId = Number(req.params.id);
  const appointment = store.appointments.find(
    (item) => item.id === appointmentId
  );

  if (!appointment) {
    return res.status(404).json({ error: "appointment not found" });
  }

  if (!canManageService(req.user, appointment.serviceId)) {
    return res.status(403).json({ error: "you cannot manage this service" });
  }

  const validStatuses = [
    "upcoming",
    "checked in",
    "completed",
    "no show"
  ];

  if (!validStatuses.includes(req.body.status)) {
    return res.status(400).json({ error: "invalid appointment status" });
  }

  const previousStatus = appointment.status;
  appointment.status = req.body.status;

  if (req.body.status === "completed" && previousStatus !== "completed") {
    store.activity.appointmentsCompleted += 1;
  }

  if (req.body.status === "no show" && previousStatus !== "no show") {
    store.activity.noShows += 1;
  }

  res.json(appointment);
});

export default router;