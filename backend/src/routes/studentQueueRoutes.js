import express from "express";
import { store } from "../data/store.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { insertByPriority } from "../utils/queueOrder.js";
import { estimateWait } from "../utils/waitTime.js";
import { recordQueueJoined, recordQueueFinished } from "../services/queueActivity.js";

const router = express.Router();
router.use(requireAuth, requireRole("student"));

function activeQueue(userId) {
  for (const service of store.services) {
    const queue = store.queues[service.id] || [];
    const index = queue.findIndex((entry) => entry.userId === userId);
    if (index !== -1) return { service, queue, entry: queue[index], index };
  }
  return null;
}

function queueDetails({ service, entry, index }) {
  return {
    queueID: `q-${entry.id}`,
    userID: entry.userId,
    userName: entry.name,
    serviceID: service.id,
    serviceName: service.name,
    priority: entry.priority === "high" ? "High" : "Standard",
    joinedAt: entry.joinedAt || null,
    position: index + 1,
    aheadPeople: index,
    estWaitMinutes: estimateWait(index + 1, service.expectedDuration),
    queueStatus: entry.status
  };
}

function selectedService(req, res) {
  const serviceID = req.body?.serviceID;
  if (!Number.isSafeInteger(serviceID) || serviceID < 1) {
    res.status(400).json({ success: false, message: "serviceID must be a positive integer." });
    return null;
  }
  const service = store.services.find((item) => item.id === serviceID);
  if (!service) res.status(404).json({ success: false, message: "Service not found." });
  return service;
}

router.get("/services", (req, res) => {
  res.json({
    success: true,
    services: store.services.map((service) => {
      const count = (store.queues[service.id] || []).length;
      return { ...service, people: count, waitMinutes: estimateWait(count + 1, service.expectedDuration) };
    })
  });
});

router.post("/join", (req, res) => {
  const service = selectedService(req, res);
  if (!service) return;
  if (!service.open) {
    return res.status(409).json({ success: false, message: "This queue is closed." });
  }
  if (activeQueue(req.user.id)) {
    return res.status(409).json({ success: false, message: "You already have an active queue visit. Leave it before joining another." });
  }
  if (req.body.priority !== undefined && !["Standard", "normal"].includes(req.body.priority)) {
    return res.status(400).json({ success: false, message: "Student joins use Standard priority." });
  }

  const entry = {
    id: store.nextQueueEntryId++,
    userId: req.user.id,
    name: `${req.user.firstName} ${req.user.lastName}`,
    priority: "normal",
    status: "waiting",
    joinedAt: new Date().toISOString(),
    joined: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  };
  const queue = store.queues[service.id] || (store.queues[service.id] = []);
  insertByPriority(queue, entry);
  recordQueueJoined(service.id, entry);

  res.status(201).json({
    success: true,
    message: "Successfully joined queue.",
    queueData: queueDetails({ service, entry, index: queue.indexOf(entry) })
  });
});

router.post("/leave", (req, res) => {
  const service = selectedService(req, res);
  if (!service) return;
  const queue = store.queues[service.id] || [];
  const index = queue.findIndex((entry) => entry.userId === req.user.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: "Cannot find an active queue visit for this service." });
  }

  const removed = queue.splice(index, 1)[0];
  recordQueueFinished(service.id, removed, "left");
  res.json({ success: true, message: "You have left the queue.", removed: { queueID: `q-${removed.id}`, serviceID: service.id } });
});

router.get("/status/:userID", (req, res) => {
  if (req.params.userID !== "me" && req.params.userID !== String(req.user.id)) {
    return res.status(403).json({ success: false, message: "You can only view your own queue status." });
  }
  const active = activeQueue(req.user.id);
  if (!active) {
    return res.json({ success: true, inQueue: false, message: "You are not in a queue." });
  }
  res.json({ success: true, inQueue: true, status: queueDetails(active) });
});

export default router;
