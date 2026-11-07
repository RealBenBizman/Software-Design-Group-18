import { staffSession } from "./helpers/staffSession.js";
import users from "../src/data/users.js";
import { store, resetStore } from "../src/data/store.js";
import request from "supertest";
import app from "../src/app.js";
import db from "../src/data/database.js";
import { resetServices } from "../src/data/serviceRepository.js";
import {
  resetEmployees,
  findEmployeeById,
  getAssignment
} from "../src/data/employeeRepository.js";

const employeeRow = (id) =>
  db.prepare("SELECT * FROM Employee WHERE id = ?").get(id);

let admin;
beforeEach(async () => {
  resetStore();
  resetServices();
  resetEmployees();
  users.length = 0;
  admin = await staffSession();
});

describe("employee management", () => {
  test("lists employee accounts with their saved assignments", async () => {
    await staffSession("employee", 1);
    await staffSession("employee", 3);

    const response = await admin.get("/api/employees");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      expect.objectContaining({
        id: 1,
        email: "staff-test-employee-1@example.com",
        role: "employee",
        serviceId: 1,
        status: "working"
      }),
      expect.objectContaining({ id: 3, serviceId: null, status: "offline" })
    ]);
    expect(response.body[0].passwordHash).toBeUndefined();
  });

  test("adds employee and stores the assignment row in SQLite", async () => {
    const response = await admin.post("/api/employees").send({
      firstName: "Avery",
      lastName: "Thomas",
      email: "avery@uh.edu",
      phone: "713-555-0123",
      password: "EmployeePassword123!"
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: 4,
      firstName: "Avery",
      email: "avery@uh.edu",
      serviceId: null,
      status: "offline"
    });
    expect(employeeRow(4)).toEqual({ id: 4, service_id: null, status: "offline" });

    const user = db.prepare("SELECT role, employee_id FROM Users WHERE email = ?")
      .get("avery@uh.edu");
    expect(user).toEqual({ role: "employee", employee_id: 4 });
    expect(store.employees.some((item) => item.id === 4)).toBe(true);
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
    const { count } = db.prepare(
      "SELECT COUNT(*) AS count FROM Users"
    ).get();

    expect(count).toBe(1);
    expect(db.prepare("SELECT COUNT(*) AS count FROM Employee").get().count).toBe(3);
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

  test("employee chooses one service and it is saved in SQLite", async () => {
    const response = await admin
      .patch("/api/employees/3/service")
      .send({ serviceId: 4 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: 3, serviceId: 4, status: "working" });
    expect(employeeRow(3)).toEqual({ id: 3, service_id: "4", status: "working" });
    expect(store.employees[2].serviceId).toBe(4);
  });

  test("employee changes assigned service", async () => {
    await admin.patch("/api/employees/1/service").send({ serviceId: 2 }).expect(200);

    expect(getAssignment(1)).toEqual({ serviceId: 2, status: "working" });
  });

  test("employee clocks out", async () => {
    const response = await admin
      .patch("/api/employees/1/clock-out");

    expect(response.status).toBe(200);
    expect(response.body.serviceId).toBe(null);
    expect(employeeRow(1)).toEqual({ id: 1, service_id: null, status: "offline" });
  });

  test("rejects invalid employee and service ids", async () => {
    await admin.patch("/api/employees/999/service").send({ serviceId: 1 }).expect(404);
    await admin.patch("/api/employees/1/service").send({ serviceId: "2" }).expect(400);
    await admin.patch("/api/employees/1/service").send({ serviceId: 0 }).expect(400);
    await admin.patch("/api/employees/1/service").send({ serviceId: 999 }).expect(404);

    expect(employeeRow(1).service_id).toBe("1");
  });

  test("assignment is cleared when the service is removed", async () => {
    await staffSession("employee", 1);
    db.prepare("DELETE FROM Service WHERE serviceID = '1'").run();

    expect(findEmployeeById(1)).toMatchObject({ serviceId: null });
  });
});
