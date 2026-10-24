import { staffSession } from "./helpers/staffSession.js";
import users from "../src/data/users.js";
import { resetStore } from "../src/data/store.js";

let admin;
beforeEach(async () => {
  resetStore();
  users.length = 0;
  admin = await staffSession();
});

describe("service management", () => {
  test("lists services", async () => {
    const response = await admin.get("/api/services");

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(4);
  });

  test("creates a valid service", async () => {
    const response = await admin.post("/api/services").send({
      name: "Veteran Benefits Help",
      description: "Help with veteran education benefits.",
      expectedDuration: 15,
      priority: "medium"
    });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Veteran Benefits Help");
    expect(response.body.open).toBe(false);
  });

  test("rejects invalid service fields", async () => {
    const response = await admin.post("/api/services").send({
      name: "",
      expectedDuration: 0,
      priority: "urgent"
    });

    expect(response.status).toBe(400);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  test("rejects service name over 100 characters", async () => {
    const response = await admin.post("/api/services").send({
      name: "a".repeat(101),
      description: "test",
      expectedDuration: 15,
      priority: "low"
    });

    expect(response.status).toBe(400);
  });

  test("updates service", async () => {
    const response = await admin.put("/api/services/1").send({
      name: "FAFSA Help",
      description: "Updated description",
      expectedDuration: 25,
      priority: "high"
    });

    expect(response.status).toBe(200);
    expect(response.body.expectedDuration).toBe(25);
  });

  test("opens a service queue", async () => {
    const response = await admin
      .patch("/api/services/4/status")
      .send({ open: true });

    expect(response.status).toBe(200);
    expect(response.body.open).toBe(true);
  });
});