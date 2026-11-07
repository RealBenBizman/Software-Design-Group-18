import request from "supertest";
import app from "../src/app.js";
import db from "../src/data/database.js";
import { store, resetStore } from "../src/data/store.js";
import {
  createQueueNotification,
  notifyAlmostReady,
  getUserNotifications,
  markNotificationRead
} from "../src/services/notificationService.js";
import { recordQueueJoined } from "../src/services/queueActivity.js";
import { createStudent, studentSession } from "./helpers/studentAccount.js";

const countNotifications = db.prepare("SELECT COUNT(*) AS total FROM NotificationHistory");
const allNotifications = db.prepare("SELECT * FROM NotificationHistory ORDER BY notifID");

let student;
let other;
let entry;

beforeEach(() => {
  resetStore();
  student = createStudent("notifications@example.com");
  other = createStudent("other-notifications@example.com");
  entry = { id: 7001, userId: student.id, name: "Test Student" };
});

describe("notification business logic", () => {
  test("joining generates a notification for that user", () => {
    store.queues[1].push(entry);
    recordQueueJoined(1, entry);
    expect(getUserNotifications(student.id)).toEqual([
      expect.objectContaining({ type: "joined", userId: student.id, read: false, status: "sent" })
    ]);
  });

  test("only the first two entries receive automatic almost-ready notifications", () => {
    const first = { ...entry, id: 7001 };
    const second = { ...entry, id: 7002, userId: other.id };
    const third = { ...entry, id: 7003 };
    store.queues[1] = [first, second, third];

    const created = notifyAlmostReady(1);

    expect(created.map((item) => item.queueEntryId)).toEqual([7001, 7002]);
    expect(allNotifications.all().map((row) => row.queueEntryID)).toEqual([7001, 7002]);
    expect(allNotifications.all().every((row) => row.type === "almost-ready")).toBe(true);
  });

  test("a new arrival at position one receives both required notification types", () => {
    store.queues[1] = [entry];
    recordQueueJoined(1, entry);
    expect(getUserNotifications(student.id).map((item) => item.type)).toEqual(["almost-ready", "joined"]);
  });

  test("repeated checks do not duplicate alerts, including after they are read", () => {
    store.queues[1] = [entry];
    const [note] = notifyAlmostReady(1);
    markNotificationRead(student.id, note.id);
    notifyAlmostReady(1);
    expect(countNotifications.get().total).toBe(1);
    expect(getUserNotifications(student.id)[0].read).toBe(true);
  });

  test("a later visit can receive new notifications", () => {
    createQueueNotification(1, entry, "joined");
    createQueueNotification(1, { ...entry, id: 7002 }, "joined");
    expect(getUserNotifications(student.id)).toHaveLength(2);
  });

  test("empty queues produce no almost-ready notifications", () => {
    store.queues[1] = [];
    expect(notifyAlmostReady(1)).toEqual([]);
    delete store.queues[1];
    expect(notifyAlmostReady(1)).toEqual([]);
  });

  test("queue entries without a registered account are skipped", () => {
    store.queues[1] = [{ id: 7001, userId: 9999 }, entry];
    expect(createQueueNotification(1, { id: 7001, userId: 9999 }, "joined")).toBeNull();
    expect(notifyAlmostReady(1).map((item) => item.userId)).toEqual([student.id]);
    expect(countNotifications.get().total).toBe(1);
  });

  test("only the owner can mark a notification as read", () => {
    const note = createQueueNotification(1, entry, "joined");
    expect(markNotificationRead(other.id, note.id)).toBeUndefined();
    expect(getUserNotifications(student.id)[0].read).toBe(false);
    expect(markNotificationRead(student.id, note.id).read).toBe(true);
    expect(allNotifications.get().status).toBe("viewed");
  });

  test("stores the message, timestamp, and sent status", () => {
    const note = createQueueNotification(2, entry, "almost-ready");
    const row = allNotifications.get();
    expect(row).toMatchObject({
      userID: student.id,
      queueEntryID: 7001,
      serviceID: 2,
      type: "almost-ready",
      message: "Your turn for Scholarships and Grants is approaching. Please be ready.",
      status: "sent"
    });
    expect(row.timeStamp).toBe(note.createdAt);
    expect(Number.isFinite(Date.parse(row.timeStamp))).toBe(true);
  });

  test("validates type and required identifiers", () => {
    expect(() => createQueueNotification(1, entry, "email")).toThrow("invalid notification type");
    expect(() => createQueueNotification(1, entry, "x".repeat(501))).toThrow();
    expect(() => createQueueNotification(1, { id: 1 }, "joined")).toThrow();
    expect(() => createQueueNotification(999, entry, "joined")).toThrow();
    expect(countNotifications.get().total).toBe(0);
  });

  test("the database rejects invalid status, type, and message values", () => {
    const insert = db.prepare(`
      INSERT INTO NotificationHistory
        (userID, queueEntryID, serviceID, type, message, timeStamp, status)
      VALUES (?, 1, 1, ?, ?, '2026-01-01T00:00:00.000Z', ?)
    `);
    expect(() => insert.run(student.id, "joined", "hello", "read")).toThrow();
    expect(() => insert.run(student.id, "email", "hello", "sent")).toThrow();
    expect(() => insert.run(student.id, "joined", "", "sent")).toThrow();
    expect(() => insert.run(student.id, "joined", "x".repeat(501), "sent")).toThrow();
    expect(() => insert.run(9999, "joined", "hello", "sent")).toThrow();
    expect(countNotifications.get().total).toBe(0);
  });

  test("deleting an account removes its notifications", () => {
    createQueueNotification(1, entry, "joined");
    db.prepare("DELETE FROM Users WHERE id = ?").run(student.id);
    expect(countNotifications.get().total).toBe(0);
  });
});

describe("notification API with the real login session", () => {
  let agent;
  let user;

  beforeEach(async () => {
    ({ agent, user } = await studentSession("notifications-api@example.com"));
  });

  test("requires login to list or update notifications", async () => {
    const note = createQueueNotification(1, { ...entry, userId: user.id }, "joined");
    await request(app).get("/api/notifications").expect(401);
    await request(app).patch(`/api/notifications/${note.id}/read`).expect(401);
  });

  test("returns only the logged-in user's notifications", async () => {
    createQueueNotification(1, { ...entry, userId: user.id }, "joined");
    createQueueNotification(1, { ...entry, id: 7002, userId: other.id }, "joined");
    const response = await agent.get(`/api/notifications?userId=${other.id}`).expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].userId).toBe(user.id);
  });

  test("joining through the queue API stores a notification the student can read back", async () => {
    await agent.post("/api/queue/join").send({ serviceID: 2 }).expect(201);
    const response = await agent.get("/api/notifications").expect(200);
    expect(response.body.map((item) => item.type)).toEqual(["joined"]);
    expect(response.body[0]).toMatchObject({
      userId: user.id,
      serviceId: 2,
      message: "You joined the queue for Scholarships and Grants.",
      read: false
    });
  });

  test("marks an owned notification read and safely repeats the request", async () => {
    const note = createQueueNotification(1, { ...entry, userId: user.id }, "joined");
    const response = await agent.patch(`/api/notifications/${note.id}/read`).expect(200);
    expect(response.body.read).toBe(true);
    expect(response.body.status).toBe("viewed");
    await agent.patch(`/api/notifications/${note.id}/read`).expect(200);
    expect(countNotifications.get().total).toBe(1);
    const listed = await agent.get("/api/notifications").expect(200);
    expect(listed.body[0].read).toBe(true);
  });

  test("rejects another user's or an unknown notification ID", async () => {
    const note = createQueueNotification(1, { ...entry, userId: other.id }, "joined");
    await agent.patch(`/api/notifications/${note.id}/read`).expect(404);
    await agent.patch("/api/notifications/999999/read").expect(404);
    expect(getUserNotifications(other.id)[0].read).toBe(false);
  });

  test.each(["invalid", "0", "-1", "1.5", "00000000-0000-0000-0000-000000000000", "x".repeat(501)])(
    "rejects malformed IDs: %.20s",
    async (id) => {
      await agent.patch(`/api/notifications/${id}/read`).expect(400);
    }
  );

  test("does not allow clients to create their own queue notifications", async () => {
    await agent.post("/api/notifications").send({ message: "You are next" }).expect(404);
    expect(countNotifications.get().total).toBe(0);
  });

  test("listing notifications does not create additional notifications", async () => {
    createQueueNotification(1, { ...entry, userId: user.id }, "joined");
    await agent.get("/api/notifications").expect(200);
    await agent.get("/api/notifications").expect(200);
    expect(countNotifications.get().total).toBe(1);
  });

  test("staff cannot access the student notification API", async () => {
    db.prepare("UPDATE Users SET role = 'employee' WHERE id = ?").run(user.id);
    await agent.get("/api/notifications").expect(403);
  });
});
