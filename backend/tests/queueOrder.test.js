import { staffSession } from "./helpers/staffSession.js";
import users from "../src/data/users.js";
import { resetStore } from "../src/data/store.js";
import { sortByPriority, insertByPriority } from "../src/utils/queueOrder.js";

let admin;
beforeEach(async () => {
  resetStore();
  users.length = 0;
  admin = await staffSession();
});

const ids = (queue) => queue.map((entry) => entry.id);

describe("queue ordering by priority and arrival", () => {
  test("sorts high priority first and keeps arrival order within a level", () => {
    const queue = [
      { id: 1, priority: "normal" },
      { id: 2, priority: "high" },
      { id: 3, priority: "normal" },
      { id: 4, priority: "high" }
    ];

    expect(ids(sortByPriority(queue))).toEqual([2, 4, 1, 3]);
  });

  test("sorting does not change the original queue", () => {
    const queue = [
      { id: 1, priority: "normal" },
      { id: 2, priority: "high" }
    ];

    sortByPriority(queue);

    expect(ids(queue)).toEqual([1, 2]);
  });

  test("treats a missing priority as normal", () => {
    const queue = [{ id: 1 }, { id: 2, priority: "high" }];

    expect(ids(sortByPriority(queue))).toEqual([2, 1]);
  });

  test("new high priority arrival goes after other high priority users", () => {
    const queue = [
      { id: 1, priority: "high" },
      { id: 2, priority: "normal" }
    ];

    insertByPriority(queue, { id: 3, priority: "high" });

    expect(ids(queue)).toEqual([1, 3, 2]);
  });

  test("new normal arrival goes to the end", () => {
    const queue = [
      { id: 1, priority: "high" },
      { id: 2, priority: "normal" }
    ];

    insertByPriority(queue, { id: 3, priority: "normal" });

    expect(ids(queue)).toEqual([1, 2, 3]);
  });

  test("insert into an empty queue", () => {
    expect(ids(insertByPriority([], { id: 1, priority: "high" }))).toEqual([1]);
  });

  test("queue starts in priority order", async () => {
    const response = await admin.get("/api/queues/1");

    // 103 is high priority, so it is ahead of the earlier normal arrivals
    expect(ids(response.body.queue)).toEqual([103, 101, 102]);
  });

  test("serve next serves the high priority user first", async () => {
    const response = await admin
      .post("/api/queues/1/serve-next")
      .send({ role: "admin" });

    expect(response.status).toBe(200);
    expect(response.body.servedUser.id).toBe(103);
    expect(ids(response.body.queue)).toEqual([101, 102]);
  });
});
