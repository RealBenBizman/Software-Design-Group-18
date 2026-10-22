
const request = require("supertest");
const app = require("../src/app");
const users = require("../src/data/users");

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
