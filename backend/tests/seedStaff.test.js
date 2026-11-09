import request from "supertest";
import app from "../src/app.js";
import seedStaff, { DEFAULT_STAFF_LOGINS } from "../src/data/seedStaff.js";
import db from "../src/data/database.js";
import users from "../src/data/users.js";
import { resetStore } from "../src/data/store.js";
import { findUserByEmail } from "../src/data/userRepository.js";

const keys = ["NODE_ENV", "DEV_EMPLOYEE_EMAIL", "DEV_EMPLOYEE_PASSWORD", "DEV_EMPLOYEE_ID", "DEV_ADMIN_EMAIL", "DEV_ADMIN_PASSWORD"];
let saved;
beforeEach(() => {
  resetStore();
  users.length = 0;
  saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  process.env.NODE_ENV = "test";
});
afterEach(() => {
  for (const key of keys) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

test("configured employee login reaches the correct staff record and assignment", async () => {
  process.env.DEV_EMPLOYEE_EMAIL = " EMPLOYEE@example.com ";
  process.env.DEV_EMPLOYEE_PASSWORD = "EmployeePassword123!";
  process.env.DEV_EMPLOYEE_ID = "2";
  process.env.DEV_ADMIN_EMAIL = "admin@example.com";
  process.env.DEV_ADMIN_PASSWORD = "AdminPassword123!";
  await seedStaff();
  await seedStaff();
  expect(findUserByEmail("employee@example.com")).not.toBeNull();
  expect(findUserByEmail("admin@example.com")).not.toBeNull();

  const employee = request.agent(app);
  await employee.post("/api/auth/login").send({ email: "employee@example.com", password: "EmployeePassword123!" }).expect(200);
  const dashboard = await employee.get("/api/dashboard/employee/me").expect(200);
  expect(dashboard.body.employee).toMatchObject({ id: 2, firstName: "Ashley" });
  expect(dashboard.body.service.id).toBe(2);
  await employee.post("/api/queues/1/serve-next").expect(403);
});

test("default development employee maps to the first seeded employee", async () => {
  process.env.DEV_EMPLOYEE_EMAIL = "employee@example.com";
  process.env.DEV_EMPLOYEE_PASSWORD = "EmployeePassword123!";
  await seedStaff();
  expect(findUserByEmail("employee@example.com")?.employeeId).toBe(1);
});

test("missing credentials or production mode do not create demo accounts", async () => {
  await seedStaff();
  expect(users).toHaveLength(0);
  process.env.NODE_ENV = "production";
  process.env.DEV_ADMIN_EMAIL = "admin@example.com";
  process.env.DEV_ADMIN_PASSWORD = "AdminPassword123!";
  await seedStaff();
  expect(users).toHaveLength(0);
});

test("invalid configured employee and weak staff password are rejected", async () => {
  process.env.DEV_EMPLOYEE_EMAIL = "employee@example.com";
  process.env.DEV_EMPLOYEE_PASSWORD = "short";
  await expect(seedStaff()).rejects.toThrow("at least 8");
  process.env.DEV_EMPLOYEE_PASSWORD = "EmployeePassword123!";
  process.env.DEV_EMPLOYEE_ID = "999";
  await expect(seedStaff()).rejects.toThrow("DEV_EMPLOYEE_ID");
  expect(users).toHaveLength(0);
});

test("default demo logins are created once and authenticate", async () => {
  await seedStaff();
  await seedStaff();

  const admin = findUserByEmail(DEFAULT_STAFF_LOGINS.admin.email);
  const employee = findUserByEmail(DEFAULT_STAFF_LOGINS.employee.email);
  expect(admin).toMatchObject({ role: "admin", userType: "staff", employeeId: null, firstName: "Demo", lastName: "Admin" });
  expect(employee).toMatchObject({ role: "employee", userType: "staff", employeeId: 1, firstName: "Jordan" });
  expect(admin.passwordHash).not.toBe(DEFAULT_STAFF_LOGINS.admin.password);

  const { count } = db.prepare("SELECT COUNT(*) AS count FROM Users WHERE email IN (?, ?)")
    .get(DEFAULT_STAFF_LOGINS.admin.email, DEFAULT_STAFF_LOGINS.employee.email);
  expect(count).toBe(2);

  for (const role of ["admin", "employee"]) {
    const login = await request(app).post("/api/auth/login").send(DEFAULT_STAFF_LOGINS[role]).expect(200);
    expect(login.body.user.role).toBe(role);
  }
});

test("production never creates the default demo logins", async () => {
  process.env.NODE_ENV = "production";
  await seedStaff();
  expect(findUserByEmail(DEFAULT_STAFF_LOGINS.admin.email)).toBeNull();
  expect(findUserByEmail(DEFAULT_STAFF_LOGINS.employee.email)).toBeNull();
});

test("default employee is skipped when employee 1 already has another login", async () => {
  process.env.DEV_EMPLOYEE_EMAIL = "first@example.com";
  await seedStaff();
  delete process.env.DEV_EMPLOYEE_EMAIL;
  await seedStaff();
  expect(findUserByEmail(DEFAULT_STAFF_LOGINS.employee.email)).toBeNull();
  expect(findUserByEmail(DEFAULT_STAFF_LOGINS.admin.email)).not.toBeNull();
});
