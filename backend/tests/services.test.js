import { staffSession } from "./helpers/staffSession.js";
import users from "../src/data/users.js";
import { store, resetStore } from "../src/data/store.js";
import db from "../src/data/database.js";
import {
  findServiceById,
  resetServices
} from "../src/data/serviceRepository.js";

const newService = {
  name: "Veteran Benefits Help",
  description: "Help with veteran education benefits.",
  expectedDuration: 15,
  priority: "medium"
};

const serviceRow = (id) =>
  db.prepare("SELECT * FROM Service WHERE serviceID = ?").get(String(id));

const queueRow = (id) =>
  db.prepare("SELECT * FROM Queue WHERE serviceID = ?").get(String(id));

let admin;
beforeEach(async () => {
  resetStore();
  resetServices();
  users.length = 0;
  admin = await staffSession();
});

describe("service management", () => {
  test("lists the seeded services from SQLite", async () => {
    const response = await admin.get("/api/services");

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(4);
    expect(response.body[0]).toEqual({
      id: 1,
      name: "FAFSA & Application Help",
      description: expect.any(String),
      expectedDuration: 20,
      priority: "high",
      open: true
    });
    expect(response.body[3].open).toBe(false);
  });

  test("creates a valid service and saves it in SQLite", async () => {
    const response = await admin.post("/api/services").send(newService);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ id: 5, ...newService, open: false });

    expect(serviceRow(5)).toMatchObject({
      serviceName: "Veteran Benefits Help",
      expectedDuration: 15,
      priority: "medium"
    });
    expect(queueRow(5).status).toBe("closed");
    expect(findServiceById(5).name).toBe("Veteran Benefits Help");
  });

  test("new services are visible to code that still reads the store", async () => {
    await admin.post("/api/services").send(newService).expect(201);

    expect(store.services.find((item) => item.id === 5).name).toBe(
      "Veteran Benefits Help"
    );
    expect(store.queues[5]).toEqual([]);
  });

  test("rejects missing fields", async () => {
    const response = await admin.post("/api/services").send({});

    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveLength(4);
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
      ...newService,
      name: "a".repeat(101)
    });

    expect(response.status).toBe(400);
  });

  test("rejects description over 500 characters", async () => {
    const response = await admin.post("/api/services").send({
      ...newService,
      description: "a".repeat(501)
    });

    expect(response.status).toBe(400);
  });

  test("rejects invalid expected duration", async () => {
    for (const expectedDuration of [0, -5, 2.5, "15", null]) {
      await admin
        .post("/api/services")
        .send({ ...newService, expectedDuration })
        .expect(400);
    }
  });

  test("rejects invalid priority", async () => {
    await admin
      .post("/api/services")
      .send({ ...newService, priority: "urgent" })
      .expect(400);
  });

  test("updates service in SQLite", async () => {
    const response = await admin.put("/api/services/1").send({
      name: "FAFSA Help",
      description: "Updated description",
      expectedDuration: 25,
      priority: "high"
    });

    expect(response.status).toBe(200);
    expect(response.body.expectedDuration).toBe(25);
    expect(serviceRow(1)).toMatchObject({
      serviceName: "FAFSA Help",
      description: "Updated description",
      expectedDuration: 25
    });
    expect(store.services[0].name).toBe("FAFSA Help");
  });

  test("rejects invalid update data and unknown or invalid ids", async () => {
    await admin.put("/api/services/1").send({ name: "" }).expect(400);
    await admin.put("/api/services/999").send(newService).expect(404);
    await admin.put("/api/services/abc").send(newService).expect(400);
  });

  test("opens a service queue in SQLite", async () => {
    const response = await admin
      .patch("/api/services/4/status")
      .send({ open: true });

    expect(response.status).toBe(200);
    expect(response.body.open).toBe(true);
    expect(queueRow(4).status).toBe("open");
  });

  test("closes a service queue", async () => {
    await admin.patch("/api/services/1/status").send({ open: false }).expect(200);

    expect(queueRow(1).status).toBe("closed");
    expect(findServiceById(1).open).toBe(false);
    expect(store.services[0].open).toBe(false);
  });

  test("rejects bad status requests", async () => {
    await admin.patch("/api/services/1/status").send({ open: "yes" }).expect(400);
    await admin.patch("/api/services/999/status").send({ open: true }).expect(404);
    await admin.patch("/api/services/0/status").send({ open: true }).expect(400);
  });

  test("does not reseed when services already exist", async () => {
    await admin.post("/api/services").send(newService).expect(201);
    await admin.put("/api/services/1").send({ ...newService, name: "Changed" }).expect(200);

    const { seedServices } = await import("../src/data/serviceRepository.js");
    seedServices();

    const { count } = db.prepare("SELECT COUNT(*) AS count FROM Service").get();
    expect(count).toBe(5);
    expect(serviceRow(1).serviceName).toBe("Changed");
  });
});
