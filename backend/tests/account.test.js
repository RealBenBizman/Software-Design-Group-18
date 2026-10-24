import request from "supertest";
import app from "../src/app.js";
import users from "../src/data/users.js";
import { store, resetStore } from "../src/data/store.js";
import { staffSession } from "./helpers/staffSession.js";

let student;
let other;
let admin;
let date;

beforeEach(async () => {
  resetStore();
  users.length = 0;
  student = request.agent(app);
  other = request.agent(app);
  for (const [agent, email] of [[student, "student@example.com"], [other, "other@example.com"]]) {
    const account = { firstName: "Test", lastName: "Student", email, password: "Password123!" };
    await agent.post("/api/auth/register").send(account).expect(201);
    await agent.post("/api/auth/login").send(account).expect(200);
  }
  admin = await staffSession();
  date = (await student.get("/api/account/appointment-options").expect(200)).body.minDate;
});

const book = (agent = student, changes = {}) => agent.post("/api/account/appointments")
  .send({ serviceId: 1, date, time: "10:00 AM", ...changes });

test("a booking appears in the staff view, persists across requests, and can be cancelled", async () => {
  expect((await student.get("/api/account/appointments")).body).toEqual([]);
  const booked = await book().expect(201);
  expect(booked.body).toMatchObject({ serviceId: 1, status: "upcoming", userId: 1 });
  expect((await student.get("/api/account/appointments")).body[0].id).toBe(booked.body.id);
  const staff = await admin.get("/api/appointments?serviceId=1").expect(200);
  expect(staff.body.some((item) => item.id === booked.body.id)).toBe(true);
  await student.delete(`/api/account/appointments/${booked.body.id}`).expect(200);
  expect((await student.get("/api/account/appointments")).body).toEqual([]);
  expect(store.appointments.some((item) => item.id === booked.body.id)).toBe(false);
});

test("appointments belong to the session owner and cannot be read or cancelled by another student", async () => {
  const booked = await book(student, { userId: 99, name: "Someone Else" }).expect(201);
  expect(booked.body.userId).toBe(1);
  expect(booked.body.name).toBe("Test Student");
  expect((await other.get("/api/account/appointments")).body).toEqual([]);
  await other.delete(`/api/account/appointments/${booked.body.id}`).expect(404);
});

test("prevents overlapping bookings and releases the slot after cancellation", async () => {
  const booked = await book().expect(201);
  await book().expect(409);
  await book(other).expect(409);
  await book(student, { serviceId: 2 }).expect(409);
  await student.delete(`/api/account/appointments/${booked.body.id}`).expect(200);
  await book(other).expect(201);
});

test.each([
  { serviceId: "1" }, { serviceId: -1 }, { date: "2026-02-30" },
  { date: "2000-01-01" }, { date: {} }, { time: "midnight" }, { time: 9 },
])("rejects invalid appointment fields %j", async (changes) => {
  await book(student, changes).expect(400);
  expect(store.appointments).toHaveLength(3);
});

test("rejects missing appointment fields, unknown services and cancellation of a checked-in booking", async () => {
  await student.post("/api/account/appointments").expect(400);
  await book(student, { serviceId: 999 }).expect(404);
  const booked = await book().expect(201);
  await admin.patch(`/api/appointments/${booked.body.id}/status`).send({ status: "checked in" }).expect(200);
  await student.delete(`/api/account/appointments/${booked.body.id}`).expect(409);
});

test("profile updates real account details and active queue names without changing privileges", async () => {
  await student.post("/api/queue/join").send({ serviceID: 1 }).expect(201);
  await student.patch("/api/account/profile").send({ firstName: "Updated", lastName: "Name",
    email: " UPDATED@example.com ", phone: "713-555-0100", role: "admin", id: 99 }).expect(200);
  const me = await student.get("/api/auth/me").expect(200);
  expect(me.body.user).toMatchObject({ id: 1, firstName: "Updated", email: "updated@example.com", role: "student" });
  expect(store.queues[1].at(-1).name).toBe("Updated Name");
  await student.post("/api/auth/logout").expect(200);
  await student.post("/api/auth/login").send({ email: "updated@example.com", password: "Password123!" }).expect(200);
});

test("validates profile lengths, email uniqueness, and phone format", async () => {
  const base = { firstName: "Test", lastName: "Student", email: "student@example.com", phone: "" };
  for (const changes of [{ firstName: "" }, { firstName: "x".repeat(51) }, { lastName: 5 },
    { email: "bad" }, { email: "x".repeat(255) }, { phone: "bad-phone" }, { phone: null }]) {
    await student.patch("/api/account/profile").send({ ...base, ...changes }).expect(400);
  }
  await student.patch("/api/account/profile").send({ ...base, email: "other@example.com" }).expect(409);
  await student.patch("/api/account/profile").send(base).expect(200);
});

test("employee profile changes update the linked staff record", async () => {
  const employee = await staffSession("employee", 2);
  await employee.patch("/api/account/profile").send({ firstName: "Ashley", lastName: "Updated",
    email: "ashley@example.com", phone: "7135550100" }).expect(200);
  expect(store.employees[1].lastName).toBe("Updated");
  expect(store.employees[0].lastName).toBe("Smith");
});

test("submitted reports reach the admin list with the authenticated author", async () => {
  const report = await student.post("/api/account/reports").send({ issueType: "system", subject: "Queue display",
    description: "The queue label could be clearer.", userId: 99 }).expect(201);
  expect(report.body).toMatchObject({ userId: 1, user: "Test Student", status: "open" });
  const reports = await admin.get("/api/reports").expect(200);
  expect(reports.body.find((item) => item.id === report.body.id).subject).toBe("Queue display");
  await admin.patch(`/api/reports/${report.body.id}/status`).send({ status: "resolved" }).expect(200);
});

test.each([
  {}, { issueType: "bad", subject: "Subject", description: "Description" },
  { issueType: ["system"], subject: "Subject", description: "Description" },
  { issueType: "system", subject: "x".repeat(101), description: "Description" },
  { issueType: "system", subject: "Subject", description: "x".repeat(1001) },
  { issueType: "system", subject: "Subject", description: 123 },
])("rejects invalid report fields %j", async (body) => {
  await student.post("/api/account/reports").send(body).expect(400);
  expect(store.reports).toHaveLength(2);
});

test("account endpoints require login and staff cannot make student bookings", async () => {
  await request(app).get("/api/account/appointments").expect(401);
  await request(app).patch("/api/account/profile").send({}).expect(401);
  await request(app).post("/api/account/reports").send({}).expect(401);
  await admin.get("/api/account/appointments").expect(403);
  await book(admin).expect(403);
});
