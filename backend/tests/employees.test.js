import { staffSession } from "./helpers/staffSession.js";
import users from "../src/data/users.js";
import { resetStore } from "../src/data/store.js";
import request from "supertest";
import app from "../src/app.js";

let admin;
beforeEach(async () => {
  resetStore();
  users.length = 0;
  admin = await staffSession();
});

describe("employee management", () => {
  test("lists employees", async () => {
    const response = await admin.get("/api/employees");

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
  });

  test("adds employee", async () => {
    const response = await admin.post("/api/employees").send({
      firstName: "Avery",
      lastName: "Thomas",
      email: "avery@uh.edu",
      phone: "713-555-0123",
      password: "EmployeePassword123!"
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("offline");
  });

  test("newly added employee can log in and manage only their own selected service", async () => {
    const credentials = { firstName: "New", lastName: "Employee", email: "new-employee@example.com",
      phone: "7135550100", password: "EmployeePassword123!", role: "admin" };
    const created = await admin.post("/api/employees").send(credentials).expect(201);
    expect(created.body.passwordHash).toBeUndefined();
    const employee = request.agent(app);
    const login = await employee.post("/api/auth/login").send(credentials).expect(200);
    expect(login.body.user.role).toBe("employee");
    const dashboard = await employee.get("/api/dashboard/employee/me").expect(200);
    expect(dashboard.body.employee.id).toBe(created.body.id);
    expect(dashboard.body.service).toBeNull();
    await employee.patch("/api/employees/me/service").send({ serviceId: 3 }).expect(200);
    await employee.post("/api/queues/1/serve-next").expect(403);
    await employee.post("/api/queues/3/serve-next").expect(200);
    await admin.post("/api/employees").send(credentials).expect(409);
  });

  test("rejects missing, short and oversized employee passwords", async () => {
    for (const password of [undefined, "short", "x".repeat(129)]) {
      await admin.post("/api/employees").send({ firstName: "New", lastName: "Employee", email: "invalid@example.com",
        phone: "7135550100", password }).expect(400);
    }
    expect(users).toHaveLength(1);
  });

  test("rejects bad employee data", async () => {
    const response = await admin.post("/api/employees").send({
      firstName: "",
      lastName: "",
      email: "wrong",
      phone: ""
    });

    expect(response.status).toBe(400);
  });

  test("employee chooses one service", async () => {
    const response = await admin
      .patch("/api/employees/3/service")
      .send({ serviceId: 4 });

    expect(response.status).toBe(200);
    expect(response.body.serviceId).toBe(4);
  });

  test("employee clocks out", async () => {
    const response = await admin
      .patch("/api/employees/1/clock-out");

    expect(response.status).toBe(200);
    expect(response.body.serviceId).toBe(null);
  });
});
