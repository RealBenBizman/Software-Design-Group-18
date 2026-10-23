import bcrypt from "bcryptjs";
import users from "../data/users.js";

async function register(req, res) {
    try {
        // 1. Extract registration information
        const {
            userType,
            firstName,
            lastName,
            email,
            phone,
            password
        } = req.body;

        // 2. Validate required fields
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

        // 3. Validate account type
        // Missing userType defaults to student for compatibility
        const accountType = userType ?? "student";

        if (!["student", "applicant"].includes(accountType)) {
            return res.status(400).json({
                error: "Invalid account type"
            });
        }

        // 4. Validate optional phone number
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

        // 5. Validate field lengths
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

        // 6. Normalize and validate email
        const normalizedEmail = email.trim().toLowerCase();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(normalizedEmail)) {
            return res.status(400).json({
                error: "Invalid email address"
            });
        }

        // 7. Check for duplicate accounts
        const existingUser = users.find(
            (user) => user.email === normalizedEmail
        );

        if (existingUser) {
            return res.status(409).json({
                error: "An account with this email already exists"
            });
        }

        // 8. Hash the password
        const passwordHash = await bcrypt.hash(password, 10);

        // 9. Create the account
        const newUser = {
            id: users.length + 1,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedEmail,
            phone: phone?.trim() || "",
            userType: accountType,
            passwordHash,
            role: "student"
        };

        // 10. Store the account in memory
        users.push(newUser);

        // 11. Return account information without the password hash
        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser.id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                phone: newUser.phone,
                userType: newUser.userType,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            error: "Internal server error"
        });
    }
}

async function login(req, res) {
    try {
        // 1. Extract login credentials
        const { email, password } = req.body;

        // 2. Validate credentials
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

        // 3. Find the account
        const normalizedEmail = email.trim().toLowerCase();

        const user = users.find(
            (user) => user.email === normalizedEmail
        );

        if (!user) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        // 4. Verify the password
        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        // 5. Regenerate the session ID after successful login
        req.session.regenerate((error) => {
            if (error) {
                console.error("Session regeneration error:", error);

                return res.status(500).json({
                    error: "Unable to create login session"
                });
            }

            // 6. Store the authenticated user's identity
            req.session.userId = user.id;

            // 7. Save the session before responding
            req.session.save((error) => {
                if (error) {
                    console.error("Session save error:", error);

                    return res.status(500).json({
                        error: "Unable to save login session"
                    });
                }

                return res.status(200).json({
                    message: "Login successful",
                    user: {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phone: user.phone,
                        userType: user.userType,
                        role: user.role
                    }
                });
            });
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            error: "Internal server error"
        });
    }
}


function getCurrentUser(req, res) {
    // Check whether the user has an active session
    if (!req.session.userId) {
        return res.status(401).json({
            error: "Not authenticated"
        });
    }

    // Find the user associated with the session
    const user = users.find(
        (user) => user.id === req.session.userId
    );

    if (!user) {
        return res.status(401).json({
            error: "User not found"
        });
    }

    // Return user details without exposing the password hash
    return res.status(200).json({
        user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            userType: user.userType,
            role: user.role
        }
    });
}

function logout(req, res) {
    // Destroy the session on the server
    req.session.destroy((error) => {
        if (error) {
            console.error("Logout error:", error);

            return res.status(500).json({
                error: "Unable to log out"
            });
        }

        // Clear the session cookie
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
