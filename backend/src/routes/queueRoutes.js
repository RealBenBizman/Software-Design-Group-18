import express from "express";
import { store } from "../data/store.js";
import { estimateWait } from "../utils/waitTime.js";

const router = express.Router();

function getService(serviceId) {
  return store.services.find((service) => service.id === serviceId);
}

function canEmployeeManage(employeeId, serviceId) {
  const employee = store.employees.find(
    (item) => item.id === Number(employeeId)
  );

  return employee && employee.serviceId === serviceId;
}

function allowedToManage(req, serviceId) {
  if (req.body.role === "admin") {
    return true;
  }

  return canEmployeeManage(req.body.employeeId, serviceId);
}

router.get("/:serviceId", (req, res) => {
  const serviceId = Number(req.params.serviceId);
  const service = getService(serviceId);

  if (!service) {
    return res.status(404).json({ error: "service not found" });
  }

  const queue = store.queues[serviceId] || [];

  res.json({
    service,
    queue,
    count: queue.length
  });
});

router.get("/:serviceId/wait-time/:position", (req, res) => {
  const serviceId = Number(req.params.serviceId);
  const position = Number(req.params.position);
  const service = getService(serviceId);

  if (!service) {
    return res.status(404).json({ error: "service not found" });
  }

  if (!Number.isInteger(position) || position < 1) {
    return res.status(400).json({ error: "position must be at least 1" });
  }

  const estimatedWait = estimateWait(position, service.expectedDuration);

  res.json({
    serviceId,
    position,
    expectedDuration: service.expectedDuration,
    estimatedWait
  });
});

router.post("/:serviceId/serve-next", (req, res) => {
  const serviceId = Number(req.params.serviceId);

  if (!getService(serviceId)) {
    return res.status(404).json({ error: "service not found" });
  }

  if (!allowedToManage(req, serviceId)) {
    return res.status(403).json({ error: "you cannot manage this queue" });
  }

  const queue = store.queues[serviceId] || [];

  if (queue.length === 0) {
    return res.status(400).json({ error: "queue is empty" });
  }

  const servedUser = queue.shift();
  servedUser.status = "served";
  store.activity.studentsServed += 1;

  res.json({
    message: "next user is now being served",
    servedUser,
    queue
  });
});

router.delete("/:serviceId/users/:userId", (req, res) => {
  const serviceId = Number(req.params.serviceId);
  const userId = Number(req.params.userId);

  if (!getService(serviceId)) {
    return res.status(404).json({ error: "service not found" });
  }

  if (!allowedToManage(req, serviceId)) {
    return res.status(403).json({ error: "you cannot manage this queue" });
  }

  const queue = store.queues[serviceId] || [];
  const index = queue.findIndex((user) => user.id === userId);

  if (index === -1) {
    return res.status(404).json({ error: "queue user not found" });
  }

  const removed = queue.splice(index, 1)[0];

  res.json({
    message: "user removed from queue",
    removed,
    queue
  });
});

router.patch("/:serviceId/users/:userId/status", (req, res) => {
  const serviceId = Number(req.params.serviceId);
  const userId = Number(req.params.userId);

  if (!allowedToManage(req, serviceId)) {
    return res.status(403).json({ error: "you cannot manage this queue" });
  }

  if (!["waiting", "almost ready"].includes(req.body.status)) {
    return res.status(400).json({
      error: "status must be waiting or almost ready"
    });
  }

  const queue = store.queues[serviceId] || [];
  const user = queue.find((item) => item.id === userId);

  if (!user) {
    return res.status(404).json({ error: "queue user not found" });
  }

  user.status = req.body.status;
  res.json(user);
});

router.patch("/:serviceId/reorder", (req, res) => {
  const serviceId = Number(req.params.serviceId);

  if (!allowedToManage(req, serviceId)) {
    return res.status(403).json({ error: "you cannot manage this queue" });
  }

  const { fromIndex, toIndex } = req.body;
  const queue = store.queues[serviceId] || [];

  if (
    !Number.isInteger(fromIndex) ||
    !Number.isInteger(toIndex) ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= queue.length ||
    toIndex >= queue.length
  ) {
    return res.status(400).json({ error: "invalid queue positions" });
  }

  const [user] = queue.splice(fromIndex, 1);
  queue.splice(toIndex, 0, user);

  res.json(queue);
});

export default router;