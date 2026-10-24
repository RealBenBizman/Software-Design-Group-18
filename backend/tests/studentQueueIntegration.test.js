import request from "supertest";
import app from "../src/app.js";
import users from "../src/data/users.js";
import { store, resetStore } from "../src/data/store.js";

import { staffSession } from "./helpers/staffSession.js";

let admin;
let student;
let studentId;

beforeEach(async () => {
  resetStore();
  users.length = 0;
  student = request.agent(app);
  const credentials = { firstName: "Integration", lastName: "Student", email: "integration@example.com", password: "TestPassword123!" };
  const registered = await student.post("/api/auth/register").send(credentials).expect(201);
  studentId = registered.body.user.id;
  await student.post("/api/auth/login").send(credentials).expect(200);
  admin = await staffSession();
});

async function join(serviceID = 1) {
  return student.post("/api/queue/join").send({ serviceID, priority: "Standard" }).expect(201);
}

async function serve(serviceID = 1) {
  return admin.post(`/api/queues/${serviceID}/serve-next`).send({ role: "admin" }).expect(200);
}

test("joins the same queue staff manage and records the session owner's visit and notification", async () => {
  const response = await student.post("/api/queue/join")
    .send({ serviceID: 1, userID: 99, userName: "Someone Else", priority: "Standard" }).expect(201);
  expect(response.body.queueData).toMatchObject({ userID: studentId, userName: "Integration Student", serviceID: 1,
    position: 4, aheadPeople: 3, estWaitMinutes: 60, priority: "Standard" });
  expect(store.queues[1].at(-1).userId).toBe(studentId);
  const history = await student.get("/api/history").expect(200);
  expect(history.body).toHaveLength(1);
  expect(history.body[0]).toMatchObject({ userId: studentId, outcome: "waiting" });
  const notices = await student.get("/api/notifications").expect(200);
  expect(notices.body.map((item) => item.type)).toEqual(["joined"]);
  const status = await student.get("/api/queue/status/me").expect(200);
  expect(status.body.status).toEqual(response.body.queueData);
  await student.get(`/api/queue/status/${studentId}`).expect(200);
});

test("leaving ends one visit; rejoining gets a new ticket and new notification", async () => {
  const first = await join();
  await student.post("/api/queue/leave").send({ serviceID: 1 }).expect(200);
  const status = await student.get("/api/queue/status/me").expect(200);
  expect(status.body.inQueue).toBe(false);
  const second = await join();
  expect(second.body.queueData.queueID).not.toBe(first.body.queueData.queueID);
  const history = await student.get("/api/history").expect(200);
  expect(history.body).toHaveLength(2);
  expect(history.body.find((item) => item.outcome === "left").endedAt).not.toBeNull();
  expect(history.body.find((item) => item.outcome === "waiting").endedAt).toBeNull();
  const notices = await student.get("/api/notifications").expect(200);
  expect(notices.body.filter((item) => item.type === "joined")).toHaveLength(2);
});

test("staff serving updates wait time, sends one almost-ready alert, then closes the same history visit", async () => {
  await join();
  await serve();
  await serve();
  const status = await student.get("/api/queue/status/me").expect(200);
  expect(status.body.status).toMatchObject({ position: 2, aheadPeople: 1, estWaitMinutes: 20 });
  const alerts = await student.get("/api/notifications").expect(200);
  expect(alerts.body.filter((item) => item.type === "almost-ready")).toHaveLength(1);
  const notice = alerts.body.find((item) => item.type === "almost-ready");
  await student.patch(`/api/notifications/${notice.id}/read`).expect(200);
  await serve();
  await serve();
  expect((await student.get("/api/queue/status/me")).body.inQueue).toBe(false);
  const history = await student.get("/api/history?outcome=served").expect(200);
  expect(history.body).toHaveLength(1);
  expect(history.body[0].joinedAt).not.toBeNull();
  const refreshed = await student.get("/api/notifications").expect(200);
  expect(refreshed.body.find((item) => item.id === notice.id).read).toBe(true);
  expect(refreshed.body.filter((item) => item.type === "almost-ready")).toHaveLength(1);
});

test("staff removal records Removed rather than Left or Served", async () => {
  await join();
  const entry = store.queues[1].find((item) => item.userId === studentId);
  await admin.delete(`/api/queues/1/users/${entry.id}`).send({ role: "admin" }).expect(200);
  const history = await student.get("/api/history").expect(200);
  expect(history.body[0].outcome).toBe("removed");
  expect((await student.get("/api/queue/status/me")).body.inQueue).toBe(false);
});

test("a short queue immediately sends joined and almost-ready notifications", async () => {
  await join(3);
  const alerts = await student.get("/api/notifications").expect(200);
  expect(alerts.body.map((item) => item.type).sort()).toEqual(["almost-ready", "joined"]);
});

test("rejects duplicate joins across services without duplicate history", async () => {
  await join();
  await student.post("/api/queue/join").send({ serviceID: 1 }).expect(409);
  await student.post("/api/queue/join").send({ serviceID: 2 }).expect(409);
  expect(store.history.filter((item) => item.userId === studentId)).toHaveLength(1);
});

test.each([undefined, null, "1", 0, -1, 1.5, {}, [], "x".repeat(501)])("validates service identifier %j before join or leave", async (serviceID) => {
  const before = JSON.stringify(store.queues);
  await student.post("/api/queue/join").send({ serviceID }).expect(400);
  await student.post("/api/queue/leave").send({ serviceID }).expect(400);
  expect(JSON.stringify(store.queues)).toBe(before);
  expect(store.history).toHaveLength(0);
  expect(store.notifications).toHaveLength(0);
});

test("rejects nonexistent services, closed queues, and student priority escalation", async () => {
  await student.post("/api/queue/join").send({ serviceID: 999 }).expect(404);
  await student.post("/api/queue/leave").send({ serviceID: 999 }).expect(404);
  await student.post("/api/queue/join").send({ serviceID: 4 }).expect(409);
  for (const priority of ["High", null, 9, "x".repeat(501)]) {
    await student.post("/api/queue/join").send({ serviceID: 1, priority }).expect(400);
  }
  expect(store.history).toHaveLength(0);
});

test("cannot leave another service or impersonate another student", async () => {
  await join();
  const second = request.agent(app);
  const credentials = { firstName: "Other", lastName: "Student", email: "other@example.com", password: "TestPassword123!" };
  await second.post("/api/auth/register").send(credentials).expect(201);
  await second.post("/api/auth/login").send(credentials).expect(200);
  await second.get(`/api/queue/status/${studentId}`).expect(403);
  await second.post("/api/queue/leave").send({ serviceID: 1, userID: studentId }).expect(404);
  await student.post("/api/queue/leave").send({ serviceID: 2 }).expect(404);
  expect((await second.get("/api/history")).body).toEqual([]);
  expect((await second.get("/api/notifications")).body).toEqual([]);
  const notice = (await student.get("/api/notifications")).body[0];
  await second.patch(`/api/notifications/${notice.id}/read`).expect(404);
  expect(store.queues[1].some((entry) => entry.userId === studentId)).toBe(true);
});

test("requires a student login for all student queue routes", async () => {
  for (const path of ["/api/queue/services", "/api/queue/status/me"]) {
    await request(app).get(path).expect(401);
  }
  for (const path of ["/api/queue/join", "/api/queue/leave"]) {
    await request(app).post(path).send({ serviceID: 1 }).expect(401);
  }
  users[0].role = "employee";
  await student.get("/api/queue/services").expect(403);
  await student.post("/api/queue/join").send({ serviceID: 1 }).expect(403);
});

test("student service counts and waits agree with the shared queue and service duration", async () => {
  const services = await student.get("/api/queue/services").expect(200);
  expect(services.body.services.find((item) => item.id === 1)).toMatchObject({ people: 3, waitMinutes: 60 });
  expect(services.body.services.find((item) => item.id === 4).open).toBe(false);
  store.services[0].expectedDuration = 7;
  const joined = await join();
  expect(joined.body.queueData.estWaitMinutes).toBe(21);
});

test("an empty or newly created service has zero wait and can be left after closing", async () => {
  store.services.push({ id: 5, name: "New Service", description: "Help", expectedDuration: 10, open: true, priority: "low" });
  const services = await student.get("/api/queue/services").expect(200);
  expect(services.body.services.find((item) => item.id === 5)).toMatchObject({ people: 0, waitMinutes: 0 });
  const joined = await join(5);
  expect(joined.body.queueData).toMatchObject({ position: 1, aheadPeople: 0, estWaitMinutes: 0 });
  store.services.at(-1).open = false;
  await student.post("/api/queue/leave").send({ serviceID: 5 }).expect(200);
  expect((await student.get("/api/history")).body[0].outcome).toBe("left");
});

test("registration skips mock visitor IDs so new accounts cannot inherit demo activity", async () => {
  users.push({ id: 10, email: "existing@example.com", role: "student" });
  const response = await request(app).post("/api/auth/register").send({ firstName: "New", lastName: "Student",
    email: "new@example.com", password: "TestPassword123!" }).expect(201);
  expect(response.body.user.id).toBe(14);
  expect(Object.values(store.queues).flat().some((entry) => entry.userId === response.body.user.id)).toBe(false);
});
