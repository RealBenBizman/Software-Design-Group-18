import { randomUUID } from "node:crypto";
import { store } from "../data/store.js";

export const HISTORY_OUTCOMES = ["waiting", "served", "left", "removed"];

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
  const service = validateQueueEvent(serviceId, entry);
  if (!HISTORY_OUTCOMES.includes(outcome)) {
    throw new Error("invalid history outcome");
  }

  const existing = store.history.find((item) =>
    item.serviceId === serviceId && item.queueEntryId === entry.id &&
    item.userId === entry.userId
  );

  if (existing && (existing.outcome !== "waiting" || outcome === "waiting")) {
    return existing;
  }

  const now = new Date().toISOString();
  if (existing) {
    existing.outcome = outcome;
    existing.endedAt = now;
    existing.updatedAt = now;
    return existing;
  }

  const joinedAt = typeof entry.joinedAt === "string" &&
    Number.isFinite(Date.parse(entry.joinedAt))
    ? new Date(entry.joinedAt).toISOString()
    : outcome === "waiting" ? now : null;

  const record = {
    id: randomUUID(),
    userId: entry.userId,
    queueEntryId: entry.id,
    serviceId,
    service: service.name,
    type: "Queue",
    joinedAt,
    endedAt: outcome === "waiting" ? null : now,
    updatedAt: now,
    outcome
  };

  store.history.push(record);
  return record;
}

export function getUserHistory(userId, outcome) {
  return store.history
    .filter((item) => item.userId === userId && (!outcome || item.outcome === outcome))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
