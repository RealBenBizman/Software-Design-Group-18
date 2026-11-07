import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../../src/app.js";
import { createUser } from "../../src/data/userRepository.js";

const password = "StudentTestPassword123!";
const passwordHash = bcrypt.hashSync(password, 4);

export function createStudent(email = "student@example.com") {
  return createUser({
    firstName: "Test",
    lastName: "Student",
    email,
    passwordHash,
    role: "student",
    userType: "student"
  });
}

export async function studentSession(email = "student@example.com") {
  const user = createStudent(email);
  const agent = request.agent(app);

  await agent
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);

  return { agent, user };
}
