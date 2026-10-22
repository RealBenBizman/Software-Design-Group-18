import express from "express";
import { store } from "../data/store.js";
import { validateService } from "../utils/validation.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json(store.services);
});

router.post("/", (req, res) => {
  const errors = validateService(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const nextId =
    store.services.length > 0
      ? Math.max(...store.services.map((service) => service.id)) + 1
      : 1;

  const service = {
    id: nextId,
    name: req.body.name.trim(),
    description: req.body.description.trim(),
    expectedDuration: req.body.expectedDuration,
    priority: req.body.priority,
    open: false
  };

  store.services.push(service);
  store.queues[service.id] = [];

  res.status(201).json(service);
});

router.put("/:id", (req, res) => {
  const serviceId = Number(req.params.id);
  const service = store.services.find((item) => item.id === serviceId);

  if (!service) {
    return res.status(404).json({ error: "service not found" });
  }

  const errors = validateService(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  service.name = req.body.name.trim();
  service.description = req.body.description.trim();
  service.expectedDuration = req.body.expectedDuration;
  service.priority = req.body.priority;

  res.json(service);
});

router.patch("/:id/status", (req, res) => {
  const serviceId = Number(req.params.id);
  const service = store.services.find((item) => item.id === serviceId);

  if (!service) {
    return res.status(404).json({ error: "service not found" });
  }

  if (typeof req.body.open !== "boolean") {
    return res.status(400).json({ error: "open must be true or false" });
  }

  service.open = req.body.open;
  res.json(service);
});

export default router;