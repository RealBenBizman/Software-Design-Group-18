import request from "supertest";
import app from "../src/app.js";
import { resetStore } from "../src/data/store.js";

beforeEach(() => {
  resetStore();
});

describe("employee management", () => {
  test("lists employees", async () => {
    const response = await request(app).get("/api/employees");

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
  });

  test("adds employee", async () => {
    const response = await request(app).post("/api/employees").send({
      firstName: "Avery",
      lastName: "Thomas",
      email: "avery@uh.edu",
      phone: "713-555-0123"
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("offline");
  });

  test("rejects bad employee data", async () => {
    const response = await request(app).post("/api/employees").send({
      firstName: "",
      lastName: "",
      email: "wrong",
      phone: ""
    });

    expect(response.status).toBe(400);
  });

  test("employee chooses one service", async () => {
    const response = await request(app)
      .patch("/api/employees/3/service")
      .send({ serviceId: 4 });

    expect(response.status).toBe(200);
    expect(response.body.serviceId).toBe(4);
  });

  test("employee clocks out", async () => {
    const response = await request(app)
      .patch("/api/employees/1/clock-out");

    expect(response.status).toBe(200);
    expect(response.body.serviceId).toBe(null);
  });
});