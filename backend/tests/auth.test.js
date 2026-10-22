
const request = require("supertest");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");

const app = require("../src/app");
const users = require("../src/data/users");

const {
    requireAuth,
    requireRole
} = require("../src/middleware/authMiddleware");

// Test user information shared by all tests
const validUser = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    password: "Example123!"
};

// Clear registered users before each test
beforeEach(() => {
    users.length = 0;
});

describe("Authentication API", () => {

    // TEST 1: Successful student registration
    test("registers a student successfully", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send(validUser);

        expect(response.statusCode).toBe(201);
        expect(response.body.user.email).toBe(validUser.email);
        expect(response.body.user.role).toBe("student");
        expect(response.body.user.passwordHash).toBeUndefined();

        // Verify that the password is hashed
        expect(users[0].passwordHash).toBeDefined();
        expect(users[0].passwordHash).not.toBe(validUser.password);
    });

    // TEST 2: Duplicate email registration
    test("rejects duplicate email registration", async () => {
        await request(app)
            .post("/api/auth/register")
            .send(validUser);

        const response = await request(app)
            .post("/api/auth/register")
            .send(validUser);

        expect(response.statusCode).toBe(409);
    });

    // TEST 3: Missing registration fields
    test("rejects missing registration fields", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                email: "john@example.com"
            });

        expect(response.statusCode).toBe(400);
    });

    // TEST 4: Invalid email format
    test("rejects invalid email addresses", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                ...validUser,
                email: "not-an-email"
            });

        expect(response.statusCode).toBe(400);
    });

    // TEST 5: Prevent admin self-registration
    test("prevents users from registering as admin", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                ...validUser,
                role: "admin"
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.user.role).toBe("student");
    });

    // TEST 6: Successful login
    test("logs in with correct credentials", async () => {
        await request(app)
            .post("/api/auth/register")
            .send(validUser);

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: validUser.email,
                password: validUser.password
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("Login successful");
        expect(response.body.user.passwordHash).toBeUndefined();
    });

    // TEST 7: Incorrect password
    test("rejects an incorrect password", async () => {
        await request(app)
            .post("/api/auth/register")
            .send(validUser);

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: validUser.email,
                password: "WrongPassword123"
            });

        expect(response.statusCode).toBe(401);
    });

    // TEST 8: Unknown email address
    test("rejects login for an unknown email", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "unknown@example.com",
                password: "Example123!"
            });

        expect(response.statusCode).toBe(401);
    });

    // TEST 9: Missing login credentials
    test("rejects login with missing credentials", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "john@example.com"
            });

        expect(response.statusCode).toBe(400);
    });

    // TEST 10: Applicant registration with phone number
    test("registers an applicant with a phone number", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                ...validUser,
                userType: "applicant",
                phone: "7135551234"
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.user.userType).toBe("applicant");
        expect(response.body.user.phone).toBe("7135551234");
        expect(response.body.user.role).toBe("student");
    });

    // TEST 11: Invalid account type
    test("rejects an invalid account type", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                ...validUser,
                userType: "admin"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Invalid account type");
    });

    // TEST 12: Invalid phone number
    test("rejects an invalid phone number", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                ...validUser,
                userType: "student",
                phone: "abc"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Invalid phone number");
    });

});

describe("Session Authentication", () => {

    const sessionUser = {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        password: "Password123!"
    };

    // TEST 13: Reject requests without an active session
    test("rejects access to /me without login", async () => {
        const response = await request(app)
            .get("/api/auth/me");

        expect(response.statusCode).toBe(401);
    });

    // TEST 14: Recognize a logged-in user
    test("returns the authenticated user after login", async () => {
        const agent = request.agent(app);

        await agent
            .post("/api/auth/register")
            .send(sessionUser);

        const loginResponse = await agent
            .post("/api/auth/login")
            .send({
                email: sessionUser.email,
                password: sessionUser.password
            });

        expect(loginResponse.statusCode).toBe(200);

        const response = await agent
            .get("/api/auth/me");

        expect(response.statusCode).toBe(200);
        expect(response.body.user.email).toBe(sessionUser.email);
        expect(response.body.user.passwordHash).toBeUndefined();
    });

    // TEST 15: Logout destroys the session
    test("destroys the session after logout", async () => {
        const agent = request.agent(app);

        await agent
            .post("/api/auth/register")
            .send(sessionUser);

        const loginResponse = await agent
            .post("/api/auth/login")
            .send({
                email: sessionUser.email,
                password: sessionUser.password
            });

        expect(loginResponse.statusCode).toBe(200);

        const logoutResponse = await agent
            .post("/api/auth/logout");

        expect(logoutResponse.statusCode).toBe(200);
        expect(logoutResponse.body.message).toBe("Logout successful");

        const meResponse = await agent
            .get("/api/auth/me");

        expect(meResponse.statusCode).toBe(401);
    });

});

describe("Role-Based Authorization", () => {

    // Separate Express app used only for testing permissions.
    // It does not change the real NEBB Queue API.
    const testApp = express();

    testApp.use(express.json());

    // Provide session support before protected routes.
    testApp.use(
        session({
            secret: "test-only-session-secret",
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true
            }
        })
    );

    // Test-only login endpoint.
    // It authenticates against our existing in-memory users.
    testApp.post("/test/login", async (req, res) => {
        const { email, password } = req.body;

        const user = users.find(
            (account) => account.email === email
        );

        if (!user) {
            return res.status(401).json({
                error: "Invalid credentials"
            });
        }

        const passwordMatches = await bcrypt.compare(
            password || "",
            user.passwordHash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                error: "Invalid credentials"
            });
        }

        req.session.regenerate((error) => {
            if (error) {
                return res.status(500).json({
                    error: "Session error"
                });
            }

            req.session.userId = user.id;

            req.session.save((saveError) => {
                if (saveError) {
                    return res.status(500).json({
                        error: "Session error"
                    });
                }

                return res.status(200).json({
                    message: "Test login successful"
                });
            });
        });
    });

    // Student-only endpoint
    testApp.get(
        "/test/student",
        requireAuth,
        requireRole("student"),
        (req, res) => {
            res.status(200).json({
                message: "Student access granted"
            });
        }
    );

    // Employee-only endpoint
    testApp.get(
        "/test/employee",
        requireAuth,
        requireRole("employee"),
        (req, res) => {
            res.status(200).json({
                message: "Employee access granted"
            });
        }
    );

    // Administrator-only endpoint
    testApp.get(
        "/test/admin",
        requireAuth,
        requireRole("admin"),
        (req, res) => {
            res.status(200).json({
                message: "Admin access granted"
            });
        }
    );

    // Helper: Register a student using the real API,
    // then log into the test-only app.
    async function createStudentAgent() {
        const registration = await request(app)
            .post("/api/auth/register")
            .send({
                firstName: "Test",
                lastName: "Student",
                email: "student-role@example.com",
                password: "Password123!"
            });

        expect(registration.statusCode).toBe(201);

        const agent = request.agent(testApp);

        const login = await agent
            .post("/test/login")
            .send({
                email: "student-role@example.com",
                password: "Password123!"
            });

        expect(login.statusCode).toBe(200);

        return agent;
    }

    // Helper: Create a staff account directly in memory.
    // Staff accounts cannot be created through public registration.
    async function createStaffAgent(role) {
        const password = "StaffPassword123!";
        const email = `${role}@example.com`;

        users.push({
            id: users.length + 1,
            firstName: "Test",
            lastName: role,
            email,
            phone: "",
            userType: "staff",
            role,
            passwordHash: await bcrypt.hash(password, 10)
        });

        const agent = request.agent(testApp);

        const login = await agent
            .post("/test/login")
            .send({
                email,
                password
            });

        expect(login.statusCode).toBe(200);

        return agent;
    }

    // TEST 16: Unauthenticated users cannot access protected routes
    test("rejects unauthenticated requests", async () => {
        const response = await request(testApp)
            .get("/test/admin");

        expect(response.statusCode).toBe(401);
    });

    // TEST 17: Students can access student endpoints
    test("allows students to access student endpoints", async () => {
        const agent = await createStudentAgent();

        const response = await agent.get("/test/student");

        expect(response.statusCode).toBe(200);
    });

    // TEST 18: Students cannot access admin endpoints
    test("prevents students from accessing admin endpoints", async () => {
        const agent = await createStudentAgent();

        const response = await agent.get("/test/admin");

        expect(response.statusCode).toBe(403);
    });

    // TEST 19: Students cannot access employee endpoints
    test("prevents students from accessing employee endpoints", async () => {
        const agent = await createStudentAgent();

        const response = await agent.get("/test/employee");

        expect(response.statusCode).toBe(403);
    });

    // TEST 20: Employees can access employee endpoints
    test("allows employees to access employee endpoints", async () => {
        const agent = await createStaffAgent("employee");

        const response = await agent.get("/test/employee");

        expect(response.statusCode).toBe(200);
    });

    // TEST 21: Employees cannot access admin endpoints
    test("prevents employees from accessing admin endpoints", async () => {
        const agent = await createStaffAgent("employee");

        const response = await agent.get("/test/admin");

        expect(response.statusCode).toBe(403);
    });

    // TEST 22: Administrators can access admin endpoints
    test("allows administrators to access admin endpoints", async () => {
        const agent = await createStaffAgent("admin");

        const response = await agent.get("/test/admin");

        expect(response.statusCode).toBe(200);
    });

    // TEST 23: Administrators cannot access employee-only endpoints
    test("prevents administrators from accessing employee-only endpoints", async () => {
        const agent = await createStaffAgent("admin");

        const response = await agent.get("/test/employee");

        expect(response.statusCode).toBe(403);
    });

    // TEST 24: Staff cannot access student-only endpoints
    test("prevents employees from accessing student-only endpoints", async () => {
        const agent = await createStaffAgent("employee");

        const response = await agent.get("/test/student");

        expect(response.statusCode).toBe(403);
    });

    // TEST 25: Sessions referencing deleted users are rejected
    test("rejects sessions when the user no longer exists", async () => {
        const agent = await createStudentAgent();

        // Simulate a user account being removed.
        users.length = 0;

        const response = await agent.get("/test/student");

        expect(response.statusCode).toBe(401);
    });

});
