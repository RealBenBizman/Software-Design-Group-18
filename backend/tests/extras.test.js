import { staffSession } from "./helpers/staffSession.js";
import users from "../src/data/users.js";
import { resetStore } from "../src/data/store.js";
import db from "../src/data/database.js";
import {
  resetServices,
  createService,
  setServiceOpen,
  updateService
} from "../src/data/serviceRepository.js";
import {
  resetEmployees,
  assignService,
  clockOut
} from "../src/data/employeeRepository.js";

let admin;
beforeEach(async () => {
  resetStore();
  resetServices();
  resetEmployees();
  users.length = 0;
  admin = await staffSession();
});

describe("admin and employee extra pages", () => {
  test("gets admin dashboard", async () => {
    const response = await admin.get("/api/dashboard/admin");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      activeServices: 4,
      openQueues: 3,
      studentsWaiting: 7,
      employeesWorking: 2
    });
  });

  test("admin dashboard counts come from SQLite", async () => {
    createService({
      name: "Advising",
      description: "Course planning",
      expectedDuration: 15,
      priority: "low"
    });
    setServiceOpen(1, false);
    clockOut(1);

    const response = await admin.get("/api/dashboard/admin").expect(200);

    expect(response.body).toMatchObject({
      activeServices: 5,
      openQueues: 2,
      employeesWorking: 1
    });
    expect(response.body.activeServices).toBe(
      db.prepare("SELECT COUNT(*) AS count FROM Service").get().count
    );
  });

  test("gets employee dashboard", async () => {
    const response = await admin.get("/api/dashboard/employee/1");

    expect(response.status).toBe(200);
    expect(response.body.service.id).toBe(1);
  });

  test("employee dashboard shows the service saved in SQLite", async () => {
    const employee = await staffSession("employee", 1);
    assignService(1, 3);
    updateService(3, {
      name: "Loans",
      description: "Loan help",
      expectedDuration: 10,
      priority: "medium"
    });

    const response = await employee.get("/api/dashboard/employee/me").expect(200);

    expect(response.body.employee).toMatchObject({
      id: 1,
      email: "staff-test-employee-1@example.com",
      serviceId: 3,
      status: "working"
    });
    expect(response.body.service).toMatchObject({ id: 3, name: "Loans" });
    // 1 waiting in service 3, so a new student is position 2: (2 - 1) * 10
    expect(response.body.estimatedWait).toBe(10);
  });

  test("clocked out employee has an empty dashboard", async () => {
    clockOut(1);

    const response = await admin.get("/api/dashboard/employee/1").expect(200);

    expect(response.body).toMatchObject({ service: null, queue: [], estimatedWait: 0 });
  });

  test("employee dashboard wait is for the next student to join", async () => {
    const response = await admin.get("/api/dashboard/employee/1");

    // 3 waiting, so a new student is position 4: (4 - 1) * 20
    expect(response.body.estimatedWait).toBe(60);
  });

  test("gets service appointments", async () => {
    const response = await admin.get(
      "/api/appointments?serviceId=1"
    );

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
  });

  test("updates appointment status", async () => {
    const response = await admin
      .patch("/api/appointments/1/status")
      .send({ status: "checked in" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("checked in");
  });

  test("gets reports", async () => {
    const response = await admin.get("/api/reports");

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    expect(response.body.every((report) => report.date)).toBe(true);
  });

  test("updates report status", async () => {
    const response = await admin
      .patch("/api/reports/1001/status")
      .send({ status: "resolved" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("resolved");
  });
});