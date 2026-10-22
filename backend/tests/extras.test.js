import request from "supertest";
import app from "../src/app.js";
import { resetStore } from "../src/data/store.js";

beforeEach(() => {
  resetStore();
});

describe("admin and employee extra pages", () => {
  test("gets admin dashboard", async () => {
    const response = await request(app).get("/api/dashboard/admin");

    expect(response.status).toBe(200);
    expect(response.body.activeServices).toBe(4);
  });

  test("gets employee dashboard", async () => {
    const response = await request(app).get("/api/dashboard/employee/1");

    expect(response.status).toBe(200);
    expect(response.body.service.id).toBe(1);
  });

  test("employee dashboard wait is for the next student to join", async () => {
    const response = await request(app).get("/api/dashboard/employee/1");

    // 3 waiting, so a new student is position 4: (4 - 1) * 20
    expect(response.body.estimatedWait).toBe(60);
  });

  test("gets service appointments", async () => {
    const response = await request(app).get(
      "/api/appointments?serviceId=1"
    );

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
  });

  test("updates appointment status", async () => {
    const response = await request(app)
      .patch("/api/appointments/1/status")
      .send({ status: "checked in" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("checked in");
  });

  test("gets reports", async () => {
    const response = await request(app).get("/api/reports");

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    expect(response.body.every((report) => report.date)).toBe(true);
  });

  test("updates report status", async () => {
    const response = await request(app)
      .patch("/api/reports/1001/status")
      .send({ status: "resolved" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("resolved");
  });
});