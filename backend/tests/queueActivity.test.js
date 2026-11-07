import db from "../src/data/database.js";
import { store, resetStore } from "../src/data/store.js";
import { recordQueueFinished } from "../src/services/queueActivity.js";
import { getUserHistory } from "../src/services/historyService.js";
import { getUserNotifications } from "../src/services/notificationService.js";
import { staffSession } from "./helpers/staffSession.js";
import { studentSession } from "./helpers/studentAccount.js";

const countHistory = db.prepare("SELECT COUNT(*) AS total FROM QueueHistory");
const countNotifications = db.prepare("SELECT COUNT(*) AS total FROM NotificationHistory");

let admin;
let employee;
let first;
let second;
let third;

async function joinAll(serviceID = 1) {
  store.queues[serviceID] = [];
  for (const student of [first, second, third]) {
    await student.agent.post("/api/queue/join").send({ serviceID }).expect(201);
  }
}

beforeEach(async () => {
  resetStore();
  admin = await staffSession();
  employee = await staffSession("employee");
  first = await studentSession("first@example.com");
  second = await studentSession("second@example.com");
  third = await studentSession("third@example.com");
});

describe("history and notifications connected to existing queue operations", () => {
  test("serving records the outcome and notifies the student newly reaching position two", async () => {
    await joinAll();
    expect(getUserNotifications(third.user.id).map((item) => item.type)).toEqual(["joined"]);
    await admin.post("/api/queues/1/serve-next").send({ role: "admin" }).expect(200);
    expect(getUserHistory(first.user.id)[0].outcome).toBe("served");
    expect(getUserNotifications(third.user.id)[0].type).toBe("almost-ready");
  });

  test("staff removal records a different outcome than student leave", async () => {
    await joinAll();
    const removed = store.queues[1][0];
    await admin.delete(`/api/queues/1/users/${removed.id}`).send({ role: "admin" }).expect(200);
    expect(getUserHistory(first.user.id)[0].outcome).toBe("removed");
    await second.agent.post("/api/queue/leave").send({ serviceID: 1 }).expect(200);
    expect(getUserHistory(second.user.id)[0].outcome).toBe("left");
  });

  test("manual almost-ready status triggers only one notification", async () => {
    await joinAll();
    const entry = store.queues[1][2];
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await admin.patch(`/api/queues/1/users/${entry.id}/status`)
        .send({ role: "admin", status: "almost ready" }).expect(200);
    }
    expect(getUserNotifications(third.user.id).map((item) => item.type)).toEqual(["almost-ready", "joined"]);
  });

  test("reordering triggers proximity notifications without creating history visits", async () => {
    await joinAll();
    const before = countHistory.get().total;
    await admin.patch("/api/queues/1/reorder")
      .send({ role: "admin", fromIndex: 2, toIndex: 0 }).expect(200);
    expect(getUserNotifications(third.user.id)[0].type).toBe("almost-ready");
    expect(countHistory.get().total).toBe(before);
  });

  test("seeded queue entries without accounts are served without recording history", async () => {
    const seeded = store.queues[1][0];
    await admin.post("/api/queues/1/serve-next").send({ role: "admin" }).expect(200);
    expect(getUserHistory(seeded.userId)).toEqual([]);
    expect(countHistory.get().total).toBe(0);
    expect(countNotifications.get().total).toBe(0);
  });

  test("a visit stays readable after the student leaves and rejoins", async () => {
    await first.agent.post("/api/queue/join").send({ serviceID: 2 }).expect(201);
    await first.agent.post("/api/queue/leave").send({ serviceID: 2 }).expect(200);
    await first.agent.post("/api/queue/join").send({ serviceID: 2 }).expect(201);
    const visits = getUserHistory(first.user.id);
    expect(visits.map((item) => item.outcome)).toEqual(["waiting", "left"]);
    expect(new Set(visits.map((item) => item.queueEntryId)).size).toBe(2);
  });

  test("failed staff operations do not generate history or notifications", async () => {
    await employee.post("/api/queues/2/serve-next")
      .send({ role: "employee", employeeId: 1 }).expect(403);
    await admin.delete("/api/queues/1/users/99999")
      .send({ role: "admin" }).expect(404);
    expect(() => recordQueueFinished(1, { id: 1, userId: first.user.id }, "waiting")).toThrow();
    expect(countHistory.get().total).toBe(0);
    expect(countNotifications.get().total).toBe(0);
  });
});
