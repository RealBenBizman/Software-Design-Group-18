import { randomUUID } from "node:crypto";
import { store } from "../data/store.js";
import { validateQueueEvent } from "./historyService.js";

export const ALMOST_READY_POSITION = 2;

export function createQueueNotification(serviceId, entry, type) {
  const service = validateQueueEvent(serviceId, entry);
  if (!["joined", "almost-ready"].includes(type)) {
    throw new Error("invalid notification type");
  }

  const existing = store.notifications.find((item) =>
    item.userId === entry.userId && item.queueEntryId === entry.id &&
    item.serviceId === serviceId && item.type === type
  );
  if (existing) {
    return existing;
  }

  const notification = {
    id: randomUUID(),
    userId: entry.userId,
    queueEntryId: entry.id,
    serviceId,
    type,
    message: type === "joined"
      ? `You joined the queue for ${service.name}.`
      : `Your turn for ${service.name} is approaching. Please be ready.`,
    createdAt: new Date().toISOString(),
    read: false
  };

  store.notifications.push(notification);
  return notification;
}

export function notifyAlmostReady(serviceId) {
  const queue = store.queues[serviceId] || [];
  return queue.slice(0, ALMOST_READY_POSITION)
    .map((entry) => createQueueNotification(serviceId, entry, "almost-ready"));
}

export function getUserNotifications(userId) {
  return store.notifications.filter((item) => item.userId === userId).reverse();
}

export function markNotificationRead(userId, notificationId) {
  const notification = store.notifications.find((item) =>
    item.id === notificationId && item.userId === userId
  );
  if (notification) {
    notification.read = true;
  }
  return notification;
}
