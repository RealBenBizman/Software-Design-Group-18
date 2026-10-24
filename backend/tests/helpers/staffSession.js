import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../../src/app.js";
import users from "../../src/data/users.js";
import { reservedDemoUserIds } from "../../src/data/store.js";

const password = "StaffTestPassword123!";
const passwordHash = bcrypt.hashSync(password, 4);

export async function staffSession(role = "admin", employeeId = 1) {
  let id = users.reduce((highest, user) => Math.max(highest, user.id), 0) + 1;
  while (reservedDemoUserIds.has(id)) id += 1;
  const email = `staff-${id}@example.com`;
  users.push({ id, firstName: "Test", lastName: role, email, passwordHash,
    role, userType: "staff", employeeId: role === "employee" ? employeeId : undefined });
  const agent = request.agent(app);
  await agent.post("/api/auth/login").send({ email, password }).expect(200);
  return agent;
}
