
import bcrypt from "bcryptjs";
import users from "./users.js";

async function seedStaff() {
    // Never create demo staff accounts in production.
    if (process.env.NODE_ENV === "production") {
        return;
    }

    const staffAccounts = [
        {
            firstName: "Demo",
            lastName: "Employee",
            email: process.env.DEV_EMPLOYEE_EMAIL,
            password: process.env.DEV_EMPLOYEE_PASSWORD,
            role: "employee"
        },
        {
            firstName: "Demo",
            lastName: "Admin",
            email: process.env.DEV_ADMIN_EMAIL,
            password: process.env.DEV_ADMIN_PASSWORD,
            role: "admin"
        }
    ];

    for (const account of staffAccounts) {
        // Skip accounts without configured credentials.
        if (!account.email || !account.password) {
            continue;
        }

        if (account.password.length < 8) {
            throw new Error(
                `Staff password must be at least 8 characters: ${account.role}`
            );
        }

        const email = account.email.trim().toLowerCase();

        const existingUser = users.find(
            (user) => user.email === email
        );

        if (existingUser) {
            continue;
        }

        const passwordHash = await bcrypt.hash(
            account.password,
            10
        );

        users.push({
            id: users.length + 1,
            firstName: account.firstName,
            lastName: account.lastName,
            email,
            phone: "",
            userType: "staff",
            passwordHash,
            role: account.role
        });
    }
}

export default seedStaff;
