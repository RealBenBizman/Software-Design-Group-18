
import bcrypt from "bcryptjs";
import {
    createUser,
    findUserByEmail,
    findUserById
} from "../data/userRepository.js";

// Return user information without exposing the password hash.
function publicUser(user) {
    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        role: user.role
    };
}

// Create and save an authenticated session.
function startSession(req, user, res, status, message) {
    req.session.regenerate((error) => {
        if (error) {
            console.error("Session regeneration error:", error);
            return res.status(500).json({
                error: "Unable to create login session"
            });
        }

        req.session.userId = user.id;

        req.session.save((error) => {
            if (error) {
                console.error("Session save error:", error);
                return res.status(500).json({
                    error: "Unable to save login session"
                });
            }

            return res.status(status).json({
                message,
                user: publicUser(user)
            });
        });
    });
}

async function register(req, res) {
    try {
        const {
            userType,
            firstName,
            lastName,
            email,
            phone,
            password
        } = req.body ?? {};

        // Validate required fields.
        if (
            typeof firstName !== "string" ||
            typeof lastName !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !firstName.trim() ||
            !lastName.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                error: "All required fields must be valid"
            });
        }

        const accountType = userType ?? "student";

        if (!["student", "applicant"].includes(accountType)) {
            return res.status(400).json({
                error: "Invalid account type"
            });
        }

        if (
            phone !== undefined &&
            (
                typeof phone !== "string" ||
                !/^[0-9()+.\s-]{7,20}$/.test(phone.trim())
            )
        ) {
            return res.status(400).json({
                error: "Invalid phone number"
            });
        }

        if (
            firstName.trim().length > 50 ||
            lastName.trim().length > 50 ||
            email.length > 254 ||
            password.length < 8 ||
            password.length > 128
        ) {
            return res.status(400).json({
                error: "Invalid field length or password length"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(normalizedEmail)) {
            return res.status(400).json({
                error: "Invalid email address"
            });
        }

        // Check SQLite for an existing account.
        if (findUserByEmail(normalizedEmail)) {
            return res.status(409).json({
                error: "An account with this email already exists"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Save credentials and profile in SQLite.
        const newUser = createUser({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedEmail,
            phone: phone?.trim() || "",
            userType: accountType,
            passwordHash,
            role: "student"
        });

        // Automatically log in after registration.
        return startSession(
            req,
            newUser,
            res,
            201,
            "User registered successfully"
        );

    } catch (error) {
        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
            return res.status(409).json({
                error: "An account with this email already exists"
            });
        }

        console.error("Registration error:", error);

        return res.status(500).json({
            error: "Internal server error"
        });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body ?? {};

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                error: "Email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Retrieve account from SQLite.
        const user = findUserByEmail(normalizedEmail);

        if (!user) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        return startSession(
            req,
            user,
            res,
            200,
            "Login successful"
        );

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            error: "Internal server error"
        });
    }
}

function getCurrentUser(req, res) {
    if (!req.session?.userId) {
        return res.status(401).json({
            error: "Not authenticated"
        });
    }

    const user = findUserById(req.session.userId);

    if (!user) {
        return res.status(401).json({
            error: "User not found"
        });
    }

    return res.status(200).json({
        user: publicUser(user)
    });
}

function logout(req, res) {
    req.session.destroy((error) => {
        if (error) {
            console.error("Logout error:", error);

            return res.status(500).json({
                error: "Unable to log out"
            });
        }

        res.clearCookie("nebb.sid", {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });

        return res.status(200).json({
            message: "Logout successful"
        });
    });
}

export {
    register,
    login,
    getCurrentUser,
    logout
};
