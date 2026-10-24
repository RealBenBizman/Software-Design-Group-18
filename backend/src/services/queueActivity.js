import { recordQueueHistory } from "./historyService.js";
import { createQueueNotification, notifyAlmostReady } from "./notificationService.js";

export function recordQueueJoined(serviceId, entry) {
  const history = recordQueueHistory(serviceId, entry, "waiting");
  createQueueNotification(serviceId, entry, "joined");
  notifyAlmostReady(serviceId);
  return history;
}

export function recordQueueFinished(serviceId, entry, outcome) {
  if (!["served", "left", "removed"].includes(outcome)) {
    throw new Error("outcome must be served, left, or removed");
  }
  const history = recordQueueHistory(serviceId, entry, outcome);
  notifyAlmostReady(serviceId);
  return history;
}
