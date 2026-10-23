import request from "supertest";
import app from "../src/app.js";
import users from "../src/data/users.js";
import { store, resetStore } from "../src/data/store.js";
import { createQueueNotification, notifyAlmostReady, getUserNotifications, markNotificationRead } from "../src/services/notificationService.js";
import { recordQueueJoined } from "../src/services/queueActivity.js";

const entry = { id: 7001, userId: 1, name: "Test Student" };

beforeEach(() => {
  resetStore();
  users.length = 0;
});

describe("notification business logic", () => {
  test("joining generates a notification for that user", () => {
    store.queues[1].push(entry);
    recordQueueJoined(1, entry);
    expect(getUserNotifications(1)).toEqual([
      expect.objectContaining({ type: "joined", userId: 1, read: false })
    ]);
  });

  test("only the first two entries receive automatic almost-ready notifications", () => {
    notifyAlmostReady(1);
    const expectedIds = store.queues[1].slice(0, 2).map((item) => item.id);
    expect(store.notifications.map((item) => item.queueEntryId)).toEqual(expectedIds);
    expect(store.notifications.every((item) => item.type === "almost-ready")).toBe(true);
  });

  test("a new arrival at position one receives both required notification types", () => {
    store.queues[1] = [entry];
    recordQueueJoined(1, entry);
    expect(getUserNotifications(1).map((item) => item.type)).toEqual(["almost-ready", "joined"]);
  });

  test("repeated checks do not duplicate alerts, including after they are read", () => {
    store.queues[1] = [entry];
    notifyAlmostReady(1);
    const note = store.notifications[0];
    markNotificationRead(1, note.id);
    notifyAlmostReady(1);
    expect(store.notifications).toHaveLength(1);
    expect(note.read).toBe(true);
  });

  test("a later visit can receive new notifications", () => {
    createQueueNotification(1, entry, "joined");
    createQueueNotification(1, { ...entry, id: 7002 }, "joined");
    expect(getUserNotifications(1)).toHaveLength(2);
  });

  test("empty queues produce no almost-ready notifications", () => {
    store.queues[1] = [];
    expect(notifyAlmostReady(1)).toEqual([]);
    delete store.queues[1];
    expect(notifyAlmostReady(1)).toEqual([]);
  });

  test("only the owner can mark a notification as read", () => {
    const note = createQueueNotification(1, entry, "joined");
    expect(markNotificationRead(2, note.id)).toBeUndefined();
    expect(note.read).toBe(false);
    expect(markNotificationRead(1, note.id).read).toBe(true);
  });

  test("validates type and required identifiers", () => {
    expect(() => createQueueNotification(1, entry, "email")).toThrow("invalid notification type");
    expect(() => createQueueNotification(1, entry, "x".repeat(501))).toThrow();
    expect(() => createQueueNotification(1, { id: 1 }, "joined")).toThrow();
    expect(() => createQueueNotification(999, entry, "joined")).toThrow();
    expect(store.notifications).toHaveLength(0);
  });
});

describe("notification API with the real login session", () => {
  let agent;
  beforeEach(async () => {
    agent = request.agent(app);
    const credentials = { firstName: "Notification", lastName: "Student", email: "notifications@example.com", password: "TestPassword123!" };
    await agent.post("/api/auth/register").send(credentials).expect(201);
    await agent.post("/api/auth/login").send(credentials).expect(200);
  });

  test("requires login to list or update notifications", async () => {
    const note = createQueueNotification(1, entry, "joined");
    await request(app).get("/api/notifications").expect(401);
    await request(app).patch(`/api/notifications/${note.id}/read`).expect(401);
  });

  test("returns only the logged-in user's notifications", async () => {
    createQueueNotification(1, entry, "joined");
    createQueueNotification(1, { ...entry, id: 7002, userId: 2 }, "joined");
    const response = await agent.get("/api/notifications?userId=2").expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].userId).toBe(1);
  });

  test("marks an owned notification read and safely repeats the request", async () => {
    const note = createQueueNotification(1, entry, "joined");
    const response = await agent.patch(`/api/notifications/${note.id}/read`).expect(200);
    expect(response.body.read).toBe(true);
    await agent.patch(`/api/notifications/${note.id}/read`).expect(200);
    expect(store.notifications).toHaveLength(1);
  });

  test("rejects another user's or an unknown notification ID", async () => {
    const note = createQueueNotification(1, { ...entry, userId: 2 }, "joined");
    await agent.patch(`/api/notifications/${note.id}/read`).expect(404);
    await agent.patch("/api/notifications/00000000-0000-0000-0000-000000000000/read").expect(404);
    expect(note.read).toBe(false);
  });

  test.each(["invalid", "123", "x".repeat(501)])("rejects malformed IDs: %.20s", async (id) => {
    await agent.patch(`/api/notifications/${id}/read`).expect(400);
  });

  test("does not allow clients to create their own queue notifications", async () => {
    await agent.post("/api/notifications").send({ message: "You are next" }).expect(404);
    expect(store.notifications).toHaveLength(0);
  });

  test("listing notifications does not create additional notifications", async () => {
    createQueueNotification(1, entry, "joined");
    await agent.get("/api/notifications").expect(200);
    await agent.get("/api/notifications").expect(200);
    expect(store.notifications).toHaveLength(1);
  });

  test("staff cannot access the student notification API", async () => {
    users[0].role = "employee";
    await agent.get("/api/notifications").expect(403);
  });
});
