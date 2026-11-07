import db from "../data/database.js";
import { store } from "../data/store.js";
import { userExists, validateQueueEvent } from "./historyService.js";

export const ALMOST_READY_POSITION = 2;
export const NOTIFICATION_TYPES = ["joined", "almost-ready"];

const selectById = db.prepare(`
  SELECT * FROM NotificationHistory WHERE notifID = ?
`);

const selectExisting = db.prepare(`
  SELECT * FROM NotificationHistory
  WHERE userID = ? AND queueEntryID = ? AND serviceID = ? AND type = ?
`);

const selectByUser = db.prepare(`
  SELECT * FROM NotificationHistory
  WHERE userID = ?
  ORDER BY notifID DESC
`);

const selectOwned = db.prepare(`
  SELECT * FROM NotificationHistory
  WHERE notifID = ? AND userID = ?
`);

const insertNotification = db.prepare(`
  INSERT INTO NotificationHistory
    (userID, queueEntryID, serviceID, type, message, timeStamp, status)
  VALUES (?, ?, ?, ?, ?, ?, 'sent')
`);

const markViewed = db.prepare(`
  UPDATE NotificationHistory SET status = 'viewed' WHERE notifID = ?
`);

function toNotification(row) {
  return {
    id: row.notifID,
    userId: row.userID,
    queueEntryId: row.queueEntryID,
    serviceId: row.serviceID,
    type: row.type,
    message: row.message,
    createdAt: row.timeStamp,
    status: row.status,
    read: row.status === "viewed"
  };
}

export function createQueueNotification(serviceId, entry, type) {
  const service = validateQueueEvent(serviceId, entry);
  if (!NOTIFICATION_TYPES.includes(type)) {
    throw new Error("invalid notification type");
  }

  if (!userExists(entry.userId)) {
    return null;
  }

  const existing = selectExisting.get(entry.userId, entry.id, serviceId, type);
  if (existing) {
    return toNotification(existing);
  }

  const message = type === "joined"
    ? `You joined the queue for ${service.name}.`
    : `Your turn for ${service.name} is approaching. Please be ready.`;

  const result = insertNotification.run(
    entry.userId,
    entry.id,
    serviceId,
    type,
    message,
    new Date().toISOString()
  );

  return toNotification(selectById.get(result.lastInsertRowid));
}

export function notifyAlmostReady(serviceId) {
  const queue = store.queues[serviceId] || [];
  return queue.slice(0, ALMOST_READY_POSITION)
    .map((entry) => createQueueNotification(serviceId, entry, "almost-ready"))
    .filter((notification) => notification !== null);
}

export function getUserNotifications(userId) {
  return selectByUser.all(userId).map(toNotification);
}

export function markNotificationRead(userId, notificationId) {
  const row = selectOwned.get(notificationId, userId);
  if (!row) {
    return undefined;
  }

  markViewed.run(row.notifID);
  return toNotification(selectById.get(row.notifID));
}
