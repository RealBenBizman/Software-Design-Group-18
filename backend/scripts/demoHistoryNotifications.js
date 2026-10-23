import "dotenv/config";
import bcrypt from "bcryptjs";
import app from "../src/app.js";
import users from "../src/data/users.js";
import { store } from "../src/data/store.js";
import { recordQueueHistory } from "../src/services/historyService.js";
import { recordQueueJoined } from "../src/services/queueActivity.js";

const password = process.env.NEBB_DEMO_PASSWORD;
if (process.env.NODE_ENV === "production" || !password || password.length < 8) {
  console.error("Use development mode and set NEBB_DEMO_PASSWORD to at least 8 characters.");
  process.exit(1);
}

users.push({
  id: 1,
  firstName: "Demo",
  lastName: "Student",
  email: "ben-demo@example.com",
  phone: "",
  userType: "student",
  role: "student",
  passwordHash: await bcrypt.hash(password, 10)
});

recordQueueHistory(1, { id: 8001, userId: 1, joinedAt: "2026-10-20T15:00:00Z" }, "served");
recordQueueHistory(2, { id: 8002, userId: 1, joinedAt: "2026-10-21T15:00:00Z" }, "left");
const currentVisit = { id: 8003, userId: 1, name: "Demo Student", priority: "normal", status: "waiting", joinedAt: new Date().toISOString() };
store.queues[1] = [currentVisit];
recordQueueJoined(1, currentVisit);

const port = process.env.PORT || 3001;
app.listen(port, (error) => {
  if (error) {
    console.error("Cannot start demo server:", error.message);
    process.exit(1);
  }
  console.log(`History/Notifications preview: http://localhost:${port}`);
  console.log("Log in as ben-demo@example.com with your NEBB_DEMO_PASSWORD.");
});
