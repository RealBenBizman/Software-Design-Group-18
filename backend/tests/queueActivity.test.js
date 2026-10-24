import { staffSession } from "./helpers/staffSession.js";
import users from "../src/data/users.js";
import { store, resetStore } from "../src/data/store.js";
import { recordQueueJoined, recordQueueFinished } from "../src/services/queueActivity.js";
import { getUserHistory } from "../src/services/historyService.js";
import { getUserNotifications } from "../src/services/notificationService.js";

let admin;
let employee;
beforeEach(async () => {
  resetStore();
  users.length = 0;
  admin = await staffSession();
  employee = await staffSession("employee");
});

describe("history and notifications connected to existing queue operations", () => {
  test("serving records the outcome and notifies the student newly reaching position two", async () => {
    const next = store.queues[1][0];
    const third = store.queues[1][2];
    recordQueueJoined(1, next);
    expect(getUserNotifications(third.userId)).toHaveLength(0);
    await admin.post("/api/queues/1/serve-next").send({ role: "admin" }).expect(200);
    expect(getUserHistory(next.userId)[0].outcome).toBe("served");
    expect(getUserNotifications(third.userId)[0].type).toBe("almost-ready");
  });

  test("staff removal records a different outcome than student leave", async () => {
    const removed = store.queues[1][0];
    await admin.delete(`/api/queues/1/users/${removed.id}`).send({ role: "admin" }).expect(200);
    expect(getUserHistory(removed.userId)[0].outcome).toBe("removed");
    const left = store.queues[1].shift();
    recordQueueFinished(1, left, "left");
    expect(getUserHistory(left.userId)[0].outcome).toBe("left");
  });

  test("manual almost-ready status triggers only one notification", async () => {
    const entry = store.queues[1][2];
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await admin.patch(`/api/queues/1/users/${entry.id}/status`)
        .send({ role: "admin", status: "almost ready" }).expect(200);
    }
    expect(getUserNotifications(entry.userId)).toHaveLength(1);
  });

  test("reordering triggers proximity notifications without creating history visits", async () => {
    const third = store.queues[1][2];
    await admin.patch("/api/queues/1/reorder")
      .send({ role: "admin", fromIndex: 2, toIndex: 0 }).expect(200);
    expect(getUserNotifications(third.userId)[0].type).toBe("almost-ready");
    expect(store.history).toHaveLength(0);
  });

  test("failed staff operations do not generate history or notifications", async () => {
    await employee.post("/api/queues/2/serve-next")
      .send({ role: "employee", employeeId: 1 }).expect(403);
    await admin.delete("/api/queues/1/users/99999")
      .send({ role: "admin" }).expect(404);
    expect(store.history).toHaveLength(0);
    expect(store.notifications).toHaveLength(0);
  });
});
