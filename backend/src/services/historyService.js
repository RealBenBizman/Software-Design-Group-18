import db from "../data/database.js";
import { store } from "../data/store.js";

export const HISTORY_OUTCOMES = ["waiting", "served", "left", "removed"];

const selectUser = db.prepare("SELECT id FROM Users WHERE id = ?");

const selectById = db.prepare(`
  SELECT * FROM QueueHistory WHERE historyID = ?
`);

const selectByEntry = db.prepare(`
  SELECT * FROM QueueHistory
  WHERE userID = ? AND queueEntryID = ? AND serviceID = ?
`);

const selectByUser = db.prepare(`
  SELECT * FROM QueueHistory
  WHERE userID = ?
  ORDER BY updatedAt DESC, historyID DESC
`);

const selectByUserAndOutcome = db.prepare(`
  SELECT * FROM QueueHistory
  WHERE userID = ? AND outcome = ?
  ORDER BY updatedAt DESC, historyID DESC
`);

const insertHistory = db.prepare(`
  INSERT INTO QueueHistory
    (userID, queueEntryID, serviceID, outcome, joinedAt, endedAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const finishHistory = db.prepare(`
  UPDATE QueueHistory
  SET outcome = ?, endedAt = ?, updatedAt = ?
  WHERE historyID = ?
`);

function toRecord(row) {
  const service = store.services.find((item) => item.id === row.serviceID);
  return {
    id: row.historyID,
    userId: row.userID,
    queueEntryId: row.queueEntryID,
    serviceId: row.serviceID,
    service: service ? service.name : null,
    type: "Queue",
    joinedAt: row.joinedAt,
    endedAt: row.endedAt,
    updatedAt: row.updatedAt,
    outcome: row.outcome
  };
}

export function userExists(userId) {
  return selectUser.get(userId) !== undefined;
}

export function validateQueueEvent(serviceId, entry) {
  if (!Number.isSafeInteger(serviceId) || serviceId < 1) {
    throw new Error("serviceId must be a positive integer");
  }

  const service = store.services.find((item) => item.id === serviceId);
  if (!service) {
    throw new Error("service not found");
  }

  if (!entry || !Number.isSafeInteger(entry.id) || entry.id < 1 ||
      !Number.isSafeInteger(entry.userId) || entry.userId < 1) {
    throw new Error("queue entry id and userId must be positive integers");
  }

  return service;
}

export function recordQueueHistory(serviceId, entry, outcome) {
  validateQueueEvent(serviceId, entry);
  if (!HISTORY_OUTCOMES.includes(outcome)) {
    throw new Error("invalid history outcome");
  }

  if (!userExists(entry.userId)) {
    return null;
  }

  const existing = selectByEntry.get(entry.userId, entry.id, serviceId);
  if (existing && (existing.outcome !== "waiting" || outcome === "waiting")) {
    return toRecord(existing);
  }

  const now = new Date().toISOString();
  if (existing) {
    finishHistory.run(outcome, now, now, existing.historyID);
    return toRecord(selectById.get(existing.historyID));
  }

  const joinedAt = typeof entry.joinedAt === "string" &&
    Number.isFinite(Date.parse(entry.joinedAt))
    ? new Date(entry.joinedAt).toISOString()
    : outcome === "waiting" ? now : null;

  const result = insertHistory.run(
    entry.userId,
    entry.id,
    serviceId,
    outcome,
    joinedAt,
    outcome === "waiting" ? null : now,
    now
  );

  return toRecord(selectById.get(result.lastInsertRowid));
}

export function getUserHistory(userId, outcome) {
  const rows = outcome
    ? selectByUserAndOutcome.all(userId, outcome)
    : selectByUser.all(userId);
  return rows.map(toRecord);
}
