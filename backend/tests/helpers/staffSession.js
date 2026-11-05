
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../../src/app.js";
import {
    createUser,
    findUserByEmail
} from "../../src/data/userRepository.js";

const password = "StaffTestPassword123!";
const passwordHash = bcrypt.hashSync(password, 4);

export async function staffSession(role = "admin", employeeId = 1) {
    // Reuse an account for the same role and employee.
    const email = role === "employee"
        ? `staff-test-employee-${employeeId}@example.com`
        : `staff-test-${role}@example.com`;

    let user = findUserByEmail(email);

    if (!user) {
        user = createUser({
            firstName: "Test",
            lastName: role,
            email,
            passwordHash,
            role,
            userType: "staff",
            employeeId: role === "employee" ? employeeId : null
        });
    }

    // Each call gets its own authenticated session.
    const agent = request.agent(app);

    await agent
        .post("/api/auth/login")
        .send({ email, password })
        .expect(200);

    return agent;
}

