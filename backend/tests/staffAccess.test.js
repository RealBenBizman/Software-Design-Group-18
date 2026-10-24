import request from "supertest";
import app from "../src/app.js";
import users from "../src/data/users.js";
import { store, resetStore } from "../src/data/store.js";
import { staffSession } from "./helpers/staffSession.js";

let admin;
let employee;
let student;

beforeEach(async () => {
  resetStore();
  users.length = 0;
  admin = await staffSession();
  employee = await staffSession("employee", 1);
  student = request.agent(app);
  const account = { firstName: "Student", lastName: "Test", email: "student@example.com", password: "Password123!" };
  await student.post("/api/auth/register").send(account).expect(201);
  await student.post("/api/auth/login").send(account).expect(200);
});

test.each([
  ["get", "/api/queues/1"],
  ["post", "/api/queues/1/serve-next"],
  ["delete", "/api/queues/1/users/101"],
  ["patch", "/api/queues/1/reorder"],
  ["patch", "/api/queues/1/users/101/status"],
  ["post", "/api/services"],
  ["put", "/api/services/1"],
  ["patch", "/api/services/1/status"],
  ["get", "/api/employees"],
  ["post", "/api/employees"],
  ["patch", "/api/employees/1/service"],
  ["patch", "/api/employees/1/clock-out"],
  ["get", "/api/dashboard/admin"],
  ["get", "/api/dashboard/employee/1"],
  ["get", "/api/reports"],
  ["patch", "/api/reports/1001/status"],
  ["get", "/api/appointments"],
  ["patch", "/api/appointments/1/status"],
])("protects %s %s from anonymous and student requests", async (method, path) => {
  const before = JSON.stringify(store);
  const forged = { role: "admin", employeeId: 1, open: false, status: "completed", serviceId: 2, fromIndex: 0, toIndex: 1 };
  await request(app)[method](path).send(forged).expect(401);
  await student[method](path).send(forged).expect(403);
  expect(JSON.stringify(store)).toBe(before);
});

test("employee cannot use another employee identity or an admin role from the request body", async () => {
  await employee.post("/api/queues/2/serve-next").send({ role: "admin", employeeId: 2 }).expect(403);
  await employee.patch("/api/queues/2/reorder").send({ role: "admin", fromIndex: 0, toIndex: 1 }).expect(403);
  await employee.delete("/api/queues/2/users/201").send({ employeeId: 2 }).expect(403);
  await employee.patch("/api/queues/2/users/201/status").send({ role: "admin", status: "almost ready" }).expect(403);
  await employee.patch("/api/services/2/status").send({ open: false }).expect(403);
  await employee.patch("/api/appointments/3/status").send({ status: "completed" }).expect(403);
  expect(store.history).toEqual([]);
  expect(store.notifications).toEqual([]);
});

test("employee uses their session-linked record and can change their own service", async () => {
  const other = await staffSession("employee", 2);
  const before = await other.get("/api/dashboard/employee/me").expect(200);
  expect(before.body.employee.id).toBe(2);
  expect(before.body.service.id).toBe(2);
  await other.patch("/api/employees/me/service").send({ serviceId: 3 }).expect(200);
  await other.post("/api/queues/2/serve-next").expect(403);
  await other.post("/api/queues/3/serve-next").expect(200);
  await other.patch("/api/services/3/status").send({ open: false }).expect(200);
  const after = await other.get("/api/dashboard/employee/2").expect(200);
  expect(after.body.service.id).toBe(3);
  expect(store.employees[0].serviceId).toBe(1);
});

test("employee cannot read or change another employee assignment", async () => {
  await employee.get("/api/dashboard/employee/2").expect(403);
  await employee.patch("/api/employees/2/service").send({ serviceId: 3 }).expect(403);
  await employee.patch("/api/employees/2/clock-out").expect(403);
  await admin.patch("/api/employees/2/service").send({ serviceId: 3 }).expect(200);
});

test("clock-out removes queue management permission and leaves an unassigned dashboard", async () => {
  await employee.patch("/api/employees/me/clock-out").expect(200);
  await employee.post("/api/queues/1/serve-next").expect(403);
  const dashboard = await employee.get("/api/dashboard/employee/me").expect(200);
  expect(dashboard.body).toMatchObject({ service: null, queue: [], appointments: [], estimatedWait: 0 });
});

test("an employee account without a linked record cannot control queues", async () => {
  users.find((user) => user.role === "employee").employeeId = undefined;
  await employee.post("/api/queues/1/serve-next").send({ employeeId: 1 }).expect(403);
  await employee.get("/api/dashboard/employee/me").expect(404);
});

test("only administrators create or edit services, add staff records and read reports", async () => {
  const service = { name: "Advising", description: "Course planning", expectedDuration: 15, priority: "low" };
  await employee.post("/api/services").send(service).expect(403);
  await employee.put("/api/services/1").send(service).expect(403);
  await employee.post("/api/employees").send({}).expect(403);
  await employee.get("/api/employees").expect(403);
  await employee.get("/api/reports").expect(403);
  await employee.get("/api/dashboard/admin").expect(403);
  await admin.post("/api/services").send(service).expect(201);
  await admin.put("/api/services/1").send(service).expect(200);
});

test("missing and invalid staff inputs return errors without changing data", async () => {
  await admin.post("/api/services").expect(400);
  await admin.post("/api/employees").expect(400);
  await admin.patch("/api/services/1/status").send({ open: "false" }).expect(400);
  await employee.patch("/api/employees/me/service").send({ serviceId: "1" }).expect(400);
  await employee.patch("/api/employees/me/service").send({ serviceId: 999 }).expect(404);
  await admin.get("/api/dashboard/employee/999").expect(404);
  await admin.patch("/api/employees/999/clock-out").expect(404);
  await admin.post("/api/queues/999/serve-next").expect(404);
  await admin.get("/api/queues/999").expect(404);
  await admin.get("/api/queues/1/wait-time/0").expect(400);
  await admin.get("/api/queues/999/wait-time/1").expect(404);
  await admin.patch("/api/queues/1/reorder").send({ fromIndex: 99, toIndex: 0 }).expect(400);
  await admin.patch("/api/queues/1/users/101/status").send({ status: "wrong" }).expect(400);
  await admin.patch("/api/queues/1/users/999/status").send({ status: "waiting" }).expect(404);
  expect(store.history).toHaveLength(0);
});

test("employee emails are normalized for duplicate detection", async () => {
  await admin.post("/api/employees").send({ firstName: "Other", lastName: "Person", email: " JSMITH@UH.EDU ", phone: "7135550100", password: "EmployeePassword123!" }).expect(409);
});

test("repeated appointment completion does not inflate staff activity", async () => {
  const count = store.activity.appointmentsCompleted;
  await employee.patch("/api/appointments/1/status").send({ status: "completed" }).expect(200);
  await employee.patch("/api/appointments/1/status").send({ status: "completed" }).expect(200);
  expect(store.activity.appointmentsCompleted).toBe(count + 1);
});

test("logout invalidates access to real staff endpoints", async () => {
  await admin.post("/api/auth/logout").expect(200);
  await admin.post("/api/queues/1/serve-next").send({ role: "admin" }).expect(401);
});

test("concurrent duplicate registrations create only one account", async () => {
  const account = { firstName: "New", lastName: "Student", email: "race@example.com", password: "Password123!" };
  const responses = await Promise.all([
    request(app).post("/api/auth/register").send(account),
    request(app).post("/api/auth/register").send(account),
  ]);
  expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
  expect(users.filter((user) => user.email === account.email)).toHaveLength(1);
});
