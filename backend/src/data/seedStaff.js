
import bcrypt from "bcryptjs";
import { store } from "./store.js";
import {
    createUser,
    findUserByEmail
} from "./userRepository.js";

// Shared development-only demo logins. Environment variables override them.
export const DEFAULT_STAFF_LOGINS = {
    employee: {
        email: "employee@queuesmart.test",
        password: "EmployeeTest123!"
    },
    admin: {
        email: "admin@queuesmart.test",
        password: "AdminTest123!"
    }
};

async function seedStaff() {
    // Never create demo staff accounts in production.
    if (process.env.NODE_ENV === "production") {
        return;
    }

    const staffAccounts = [
        {
            firstName: "Demo",
            lastName: "Employee",
            email: process.env.DEV_EMPLOYEE_EMAIL || DEFAULT_STAFF_LOGINS.employee.email,
            password: process.env.DEV_EMPLOYEE_PASSWORD || DEFAULT_STAFF_LOGINS.employee.password,
            role: "employee"
        },
        {
            firstName: "Demo",
            lastName: "Admin",
            email: process.env.DEV_ADMIN_EMAIL || DEFAULT_STAFF_LOGINS.admin.email,
            password: process.env.DEV_ADMIN_PASSWORD || DEFAULT_STAFF_LOGINS.admin.password,
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

        // Check SQLite instead of the old users array.
        const existingUser = findUserByEmail(email);

        if (existingUser) {
            continue;
        }

        const employee = account.role === "employee"
            ? store.employees.find(
                (item) =>
                    item.id === Number(process.env.DEV_EMPLOYEE_ID || 1)
            )
            : null;

        if (account.role === "employee" && !employee) {
            throw new Error(
                "DEV_EMPLOYEE_ID must identify an existing employee"
            );
        }

        const passwordHash = await bcrypt.hash(
            account.password,
            10
        );

        // Save staff credentials and profile in SQLite.
        try {
            createUser({
                firstName: employee?.firstName || account.firstName,
                lastName: employee?.lastName || account.lastName,
                email,
                phone: "",
                userType: "staff",
                passwordHash,
                role: account.role,
                employeeId: employee?.id ?? null
            });
        } catch (error) {
            // Another account is already linked to this employee record.
            if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
                console.warn(
                    `Skipped demo ${account.role} login ${email}: employee record is already linked to another account.`
                );
                continue;
            }

            throw error;
        }

        // Keep the demo employee record synchronized.
        if (employee) {
            employee.email = email;
        }
    }
}

export default seedStaff;
