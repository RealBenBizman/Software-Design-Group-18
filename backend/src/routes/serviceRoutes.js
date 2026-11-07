import express from "express";
import {
  listServices,
  findServiceById,
  createService,
  updateService,
  setServiceOpen
} from "../data/serviceRepository.js";
import { validateService, isValidId } from "../utils/validation.js";

import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { canManageService } from "../middleware/staffAccess.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  res.json(listServices());
});

router.post("/", requireRole("admin"), (req, res) => {
  const errors = validateService(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  res.status(201).json(createService(req.body));
});

router.put("/:id", requireRole("admin"), (req, res) => {
  const serviceId = Number(req.params.id);

  if (!isValidId(serviceId)) {
    return res.status(400).json({ error: "service id must be a positive integer" });
  }

  if (!findServiceById(serviceId)) {
    return res.status(404).json({ error: "service not found" });
  }

  const errors = validateService(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  res.json(updateService(serviceId, req.body));
});

router.patch("/:id/status", requireRole("admin", "employee"), (req, res) => {
  const serviceId = Number(req.params.id);

  if (!isValidId(serviceId)) {
    return res.status(400).json({ error: "service id must be a positive integer" });
  }

  if (!findServiceById(serviceId)) {
    return res.status(404).json({ error: "service not found" });
  }

  if (!canManageService(req.user, serviceId)) {
    return res.status(403).json({ error: "you cannot manage this queue" });
  }

  if (typeof req.body.open !== "boolean") {
    return res.status(400).json({ error: "open must be true or false" });
  }

  res.json(setServiceOpen(serviceId, req.body.open));
});

export default router;
