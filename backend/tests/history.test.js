import request from "supertest";
import app from "../src/app.js";
import db from "../src/data/database.js";
import { store, resetStore } from "../src/data/store.js";
import { recordQueueHistory, getUserHistory } from "../src/services/historyService.js";
import { recordQueueJoined, recordQueueFinished } from "../src/services/queueActivity.js";
import { createStudent, studentSession } from "./helpers/studentAccount.js";

const countHistory = db.prepare("SELECT COUNT(*) AS total FROM QueueHistory");
const countNotifications = db.prepare("SELECT COUNT(*) AS total FROM NotificationHistory");

let student;
let other;
let entry;

beforeEach(() => {
  resetStore();
  student = createStudent("history@example.com");
  other = createStudent("other-history@example.com");
  entry = { id: 7001, userId: student.id, name: "Test Student", joinedAt: "2026-10-22T12:00:00Z" };
});

describe("history business logic", () => {
  test("one queue visit changes from waiting to served without losing its join time", () => {
    recordQueueHistory(1, entry, "waiting");
    const record = recordQueueHistory(1, entry, "served");
    expect(countHistory.get().total).toBe(1);
    expect(record).toMatchObject({ userId: student.id, queueEntryId: 7001, outcome: "served" });
    expect(record.joinedAt).toBe("2026-10-22T12:00:00.000Z");
    expect(record.endedAt).not.toBeNull();
  });

  test("duplicate events do not create records or overwrite a final outcome", () => {
    const first = recordQueueHistory(1, entry, "waiting");
    expect(recordQueueHistory(1, entry, "waiting")).toEqual(first);
    recordQueueHistory(1, entry, "left");
    recordQueueHistory(1, entry, "served");
    expect(countHistory.get().total).toBe(1);
    expect(getUserHistory(student.id)[0].outcome).toBe("left");
  });

  test("rejoining creates a separate visit with a new queue entry ID", () => {
    recordQueueHistory(1, entry, "left");
    recordQueueHistory(1, { ...entry, id: 7002 }, "waiting");
    expect(getUserHistory(student.id)).toHaveLength(2);
  });

  test("records a finish without inventing a join date", () => {
    const record = recordQueueHistory(1, { id: 7001, userId: student.id }, "served");
    expect(record.joinedAt).toBeNull();
    expect(record.endedAt).not.toBeNull();
  });

  test("uses the current time when a new join has no ISO timestamp", () => {
    const record = recordQueueHistory(1, { id: 7001, userId: student.id }, "waiting");
    expect(Number.isFinite(Date.parse(record.joinedAt))).toBe(true);
  });

  test("records persist across separate reads and resolve the service name", () => {
    const record = recordQueueHistory(2, entry, "served");
    const [stored] = getUserHistory(student.id);
    expect(stored).toEqual(record);
    expect(stored.service).toBe("Scholarships and Grants");
    expect(stored.type).toBe("Queue");
  });

  test("filters by user and outcome and returns recent activity first", () => {
    const older = recordQueueHistory(1, entry, "served");
    db.prepare("UPDATE QueueHistory SET updatedAt = ? WHERE historyID = ?")
      .run("2026-01-01T00:00:00.000Z", older.id);
    const newer = recordQueueHistory(1, { ...entry, id: 7002 }, "left");
    recordQueueHistory(1, { ...entry, id: 7003, userId: other.id }, "served");
    expect(getUserHistory(student.id).map((item) => item.id)).toEqual([newer.id, older.id]);
    expect(getUserHistory(student.id, "served").map((item) => item.id)).toEqual([older.id]);
    expect(getUserHistory(99)).toEqual([]);
  });

  test("ignores queue entries that do not belong to a registered account", () => {
    expect(recordQueueHistory(1, { id: 7001, userId: 9999 }, "waiting")).toBeNull();
    expect(countHistory.get().total).toBe(0);
  });

  test.each([0, -1, 1.5, "1", null])("rejects invalid service ID %s", (id) => {
    expect(() => recordQueueHistory(id, entry, "waiting")).toThrow();
    expect(countHistory.get().total).toBe(0);
  });

  test("rejects a nonexistent service", () => {
    expect(() => recordQueueHistory(999, entry, "waiting")).toThrow("service not found");
  });

  test.each([null, {}, { id: "1", userId: 1 }, { id: 1, userId: 0 }, { id: 0, userId: 1 }])(
    "rejects missing or invalid queue identifiers: %j", (badEntry) => {
      expect(() => recordQueueHistory(1, badEntry, "waiting")).toThrow();
    }
  );

  test("rejects unsupported and excessively long outcomes", () => {
    for (const outcome of [undefined, 12, "cancelled", "x".repeat(501)]) {
      expect(() => recordQueueHistory(1, entry, outcome)).toThrow("invalid history outcome");
    }
  });

  test("the database rejects outcomes outside the allowed set", () => {
    expect(() => db.prepare(`
      INSERT INTO QueueHistory (userID, queueEntryID, serviceID, outcome, updatedAt)
      VALUES (?, 1, 1, 'cancelled', '2026-01-01T00:00:00.000Z')
    `).run(student.id)).toThrow();
  });

  test("the database rejects a second record for the same visit", () => {
    recordQueueHistory(1, entry, "waiting");
    expect(() => db.prepare(`
      INSERT INTO QueueHistory (userID, queueEntryID, serviceID, outcome, updatedAt)
      VALUES (?, ?, 1, 'waiting', '2026-01-01T00:00:00.000Z')
    `).run(student.id, entry.id)).toThrow();
  });

  test("deleting an account removes its history", () => {
    recordQueueHistory(1, entry, "served");
    db.prepare("DELETE FROM Users WHERE id = ?").run(student.id);
    expect(countHistory.get().total).toBe(0);
  });

  test("join/leave hooks record activity without changing queue ordering", () => {
    store.queues[1].push(entry);
    const order = store.queues[1].map((item) => item.id);
    recordQueueJoined(1, entry);
    expect(store.queues[1].map((item) => item.id)).toEqual(order);
    store.queues[1].pop();
    recordQueueFinished(1, entry, "left");
    expect(getUserHistory(student.id)[0].outcome).toBe("left");
    expect(() => recordQueueFinished(1, entry, "waiting")).toThrow();
  });

  test("the test database starts empty for each test", () => {
    recordQueueJoined(1, entry);
    expect(countHistory.get().total).toBe(1);
    expect(countNotifications.get().total).toBeGreaterThan(0);
  });

  test("history and notification tables are empty at the start of a test", () => {
    expect(countHistory.get().total).toBe(0);
    expect(countNotifications.get().total).toBe(0);
  });
});

describe("history API with the real login session", () => {
  let agent;
  let user;

  beforeEach(async () => {
    ({ agent, user } = await studentSession("history-api@example.com"));
  });

  test("requires authentication", async () => {
    await request(app).get("/api/history").expect(401);
  });

  test("returns an empty list for a new student", async () => {
    const response = await agent.get("/api/history").expect(200);
    expect(response.body).toEqual([]);
  });

  test("gets only the session user's records even if another userId is supplied", async () => {
    recordQueueHistory(1, { ...entry, userId: user.id }, "served");
    recordQueueHistory(1, { ...entry, id: 7002, userId: other.id }, "left");
    const response = await agent.get(`/api/history?userId=${other.id}`).expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].userId).toBe(user.id);
  });

  test("returns stored visits after a join and leave through the queue API", async () => {
    await agent.post("/api/queue/join").send({ serviceID: 1 }).expect(201);
    await agent.post("/api/queue/leave").send({ serviceID: 1 }).expect(200);
    const response = await agent.get("/api/history").expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      userId: user.id,
      serviceId: 1,
      service: "FAFSA and Application Assistance",
      outcome: "left"
    });
    expect(response.body[0].endedAt).not.toBeNull();
  });

  test("validates outcome filters", async () => {
    recordQueueHistory(1, { ...entry, userId: user.id }, "served");
    const response = await agent.get("/api/history?outcome=served").expect(200);
    expect(response.body).toHaveLength(1);
    await agent.get("/api/history?outcome=unknown").expect(400);
    await agent.get("/api/history?outcome=" + "x".repeat(501)).expect(400);
    await agent.get("/api/history?outcome=left&outcome=served").expect(400);
  });

  test("staff roles cannot use the student history API", async () => {
    db.prepare("UPDATE Users SET role = 'admin' WHERE id = ?").run(user.id);
    await agent.get("/api/history").expect(403);
  });

  test("a student cannot POST a fabricated history record", async () => {
    await agent.post("/api/history").send({ outcome: "served" }).expect(404);
    expect(countHistory.get().total).toBe(0);
  });
});
