import { staffSession } from "./helpers/staffSession.js";
import users from "../src/data/users.js";
import { resetStore } from "../src/data/store.js";
import { resetServices, updateService } from "../src/data/serviceRepository.js";
import { resetEmployees } from "../src/data/employeeRepository.js";

let admin;
let employee;
beforeEach(async () => {
  resetStore();
  resetServices();
  resetEmployees();
  users.length = 0;
  admin = await staffSession();
  employee = await staffSession("employee");
});

describe("queue management", () => {
  test("views queue", async () => {
    const response = await admin.get("/api/queues/1");

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(3);
  });

  test("calculates wait time", async () => {
    const response = await admin.get(
      "/api/queues/1/wait-time/3"
    );

    expect(response.status).toBe(200);
    expect(response.body.estimatedWait).toBe(40);
  });

  test("queue uses the service details saved in SQLite", async () => {
    updateService(1, {
      name: "FAFSA Help",
      description: "Updated",
      expectedDuration: 5,
      priority: "high"
    });

    const queue = await admin.get("/api/queues/1").expect(200);
    const wait = await admin.get("/api/queues/1/wait-time/3").expect(200);

    expect(queue.body.service.name).toBe("FAFSA Help");
    expect(wait.body.estimatedWait).toBe(10);
  });

  test("rejects unknown and invalid service ids", async () => {
    await admin.get("/api/queues/999").expect(404);
    await admin.get("/api/queues/abc").expect(404);
    await admin.post("/api/queues/999/serve-next").expect(404);
  });

  test("employee serves next user in assigned queue", async () => {
    const response = await employee
      .post("/api/queues/1/serve-next")
      .send({ employeeId: 1, role: "employee" });

    expect(response.status).toBe(200);
    expect(response.body.queue.length).toBe(2);
  });

  test("employee cannot manage another queue", async () => {
    const response = await employee
      .post("/api/queues/2/serve-next")
      .send({ employeeId: 1, role: "employee" });

    expect(response.status).toBe(403);
  });

  test("admin can manage any queue", async () => {
    const response = await admin
      .post("/api/queues/2/serve-next")
      .send({ role: "admin" });

    expect(response.status).toBe(200);
  });

  test("removes user", async () => {
    const response = await admin
      .delete("/api/queues/1/users/102")
      .send({ employeeId: 1, role: "employee" });

    expect(response.status).toBe(200);
    expect(response.body.queue.length).toBe(2);
  });

  test("updates user status", async () => {
    const response = await admin
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
    const response = await admin
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