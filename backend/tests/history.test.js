import request from "supertest";
import app from "../src/app.js";
import users from "../src/data/users.js";
import { store, resetStore } from "../src/data/store.js";
import { recordQueueHistory, getUserHistory } from "../src/services/historyService.js";
import { recordQueueJoined, recordQueueFinished } from "../src/services/queueActivity.js";

const entry = { id: 7001, userId: 1, name: "Test Student", joinedAt: "2026-10-22T12:00:00Z" };

beforeEach(() => {
  resetStore();
  users.length = 0;
});

describe("history business logic", () => {
  test("one queue visit changes from waiting to served without losing its join time", () => {
    const record = recordQueueHistory(1, entry, "waiting");
    recordQueueHistory(1, entry, "served");
    expect(store.history).toHaveLength(1);
    expect(record).toMatchObject({ userId: 1, queueEntryId: 7001, outcome: "served" });
    expect(record.joinedAt).toBe("2026-10-22T12:00:00.000Z");
    expect(record.endedAt).not.toBeNull();
  });

  test("duplicate events do not create records or overwrite a final outcome", () => {
    const first = recordQueueHistory(1, entry, "waiting");
    expect(recordQueueHistory(1, entry, "waiting")).toBe(first);
    recordQueueHistory(1, entry, "left");
    recordQueueHistory(1, entry, "served");
    expect(store.history).toHaveLength(1);
    expect(first.outcome).toBe("left");
  });

  test("rejoining creates a separate visit with a new queue entry ID", () => {
    recordQueueHistory(1, entry, "left");
    recordQueueHistory(1, { ...entry, id: 7002 }, "waiting");
    expect(getUserHistory(1)).toHaveLength(2);
  });

  test("records a finish for an existing mock entry without inventing a join date", () => {
    const record = recordQueueHistory(1, store.queues[1][0], "served");
    expect(record.joinedAt).toBeNull();
    expect(record.endedAt).not.toBeNull();
  });

  test("uses the current time when a new join has no ISO timestamp", () => {
    const record = recordQueueHistory(1, { id: 7001, userId: 1 }, "waiting");
    expect(Number.isFinite(Date.parse(record.joinedAt))).toBe(true);
  });

  test("filters by user and outcome and returns recent activity first", () => {
    const older = recordQueueHistory(1, entry, "served");
    older.updatedAt = "2026-01-01T00:00:00.000Z";
    const newer = recordQueueHistory(1, { ...entry, id: 7002 }, "left");
    recordQueueHistory(1, { ...entry, id: 7003, userId: 2 }, "served");
    expect(getUserHistory(1).map((item) => item.id)).toEqual([newer.id, older.id]);
    expect(getUserHistory(1, "served")).toEqual([older]);
    expect(getUserHistory(99)).toEqual([]);
  });

  test.each([0, -1, 1.5, "1", null])("rejects invalid service ID %s", (id) => {
    expect(() => recordQueueHistory(id, entry, "waiting")).toThrow();
    expect(store.history).toEqual([]);
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

  test("join/leave hooks record activity without changing queue ordering", () => {
    store.queues[1].push(entry);
    const order = store.queues[1].map((item) => item.id);
    recordQueueJoined(1, entry);
    expect(store.queues[1].map((item) => item.id)).toEqual(order);
    store.queues[1].pop();
    recordQueueFinished(1, entry, "left");
    expect(getUserHistory(1)[0].outcome).toBe("left");
    expect(() => recordQueueFinished(1, entry, "waiting")).toThrow();
  });

  test("reset clears history and notifications between tests", () => {
    recordQueueJoined(1, entry);
    resetStore();
    expect(store.history).toEqual([]);
    expect(store.notifications).toEqual([]);
  });
});

describe("history API with the real login session", () => {
  let agent;
  beforeEach(async () => {
    agent = request.agent(app);
    const credentials = { firstName: "History", lastName: "Student", email: "history@example.com", password: "TestPassword123!" };
    await agent.post("/api/auth/register").send(credentials).expect(201);
    await agent.post("/api/auth/login").send(credentials).expect(200);
  });

  test("requires authentication", async () => {
    await request(app).get("/api/history").expect(401);
  });

  test("returns an empty list for a new student", async () => {
    const response = await agent.get("/api/history").expect(200);
    expect(response.body).toEqual([]);
  });

  test("gets only the session user's records even if another userId is supplied", async () => {
    recordQueueHistory(1, entry, "served");
    recordQueueHistory(1, { ...entry, id: 7002, userId: 2 }, "left");
    const response = await agent.get("/api/history?userId=2").expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].userId).toBe(1);
  });

  test("validates outcome filters", async () => {
    recordQueueHistory(1, entry, "served");
    const response = await agent.get("/api/history?outcome=served").expect(200);
    expect(response.body).toHaveLength(1);
    await agent.get("/api/history?outcome=unknown").expect(400);
    await agent.get("/api/history?outcome=" + "x".repeat(501)).expect(400);
    await agent.get("/api/history?outcome=left&outcome=served").expect(400);
  });

  test("staff roles cannot use the student history API", async () => {
    users[0].role = "admin";
    await agent.get("/api/history").expect(403);
  });

  test("a student cannot POST a fabricated history record", async () => {
    await agent.post("/api/history").send({ outcome: "served" }).expect(404);
    expect(store.history).toHaveLength(0);
  });
});
