import request from "supertest";
import app from "../src/app.js";
import { resetStore } from "../src/data/store.js";

beforeEach(() => {
  resetStore();
});

describe("queue management", () => {
  test("views queue", async () => {
    const response = await request(app).get("/api/queues/1");

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(3);
  });

  test("calculates wait time", async () => {
    const response = await request(app).get(
      "/api/queues/1/wait-time/3"
    );

    expect(response.status).toBe(200);
    expect(response.body.estimatedWait).toBe(40);
  });

  test("employee serves next user in assigned queue", async () => {
    const response = await request(app)
      .post("/api/queues/1/serve-next")
      .send({ employeeId: 1, role: "employee" });

    expect(response.status).toBe(200);
    expect(response.body.queue.length).toBe(2);
  });

  test("employee cannot manage another queue", async () => {
    const response = await request(app)
      .post("/api/queues/2/serve-next")
      .send({ employeeId: 1, role: "employee" });

    expect(response.status).toBe(403);
  });

  test("admin can manage any queue", async () => {
    const response = await request(app)
      .post("/api/queues/2/serve-next")
      .send({ role: "admin" });

    expect(response.status).toBe(200);
  });

  test("removes user", async () => {
    const response = await request(app)
      .delete("/api/queues/1/users/102")
      .send({ employeeId: 1, role: "employee" });

    expect(response.status).toBe(200);
    expect(response.body.queue.length).toBe(2);
  });

  test("updates user status", async () => {
    const response = await request(app)
      .patch("/api/queues/1/users/101/status")
      .send({
        employeeId: 1,
        role: "employee",
        status: "almost ready"
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("almost ready");
  });

  test("reorders queue", async () => {
    const response = await request(app)
      .patch("/api/queues/1/reorder")
      .send({
        employeeId: 1,
        role: "employee",
        fromIndex: 2,
        toIndex: 0
      });

    // starting order is 103 (high), 101, 102, so index 2 is 102
    expect(response.status).toBe(200);
    expect(response.body[0].id).toBe(102);
  });
});