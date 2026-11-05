
import db from "./database.js";
import { reservedDemoUserIds } from "./store.js";

// Convert database columns into the format used by QueueSmart.
function mapUser(row) {
    if (!row) return null;

    return {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role,
        userType: row.user_type,
        employeeId: row.employee_id,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone
    };
}

const userSelect = `
    SELECT
        u.id,
        u.email,
        u.password_hash,
        u.role,
        u.user_type,
        u.employee_id,
        p.first_name,
        p.last_name,
        p.phone
    FROM Users u
    JOIN Profiles p ON p.user_id = u.id
`;

export function findUserByEmail(email) {
    if (typeof email !== "string") return null;

    const row = db.prepare(`
        ${userSelect}
        WHERE u.email = ?
    `).get(email.trim().toLowerCase());

    return mapUser(row);
}

export function findUserById(id) {
    const row = db.prepare(`
        ${userSelect}
        WHERE u.id = ?
    `).get(id);

    return mapUser(row);
}

// Find the next available ID without using reserved demo IDs.
function getNextUserId() {
    const result = db.prepare(`
        SELECT COALESCE(MAX(id), 0) AS highestId
        FROM Users
    `).get();

    let nextId = result.highestId + 1;

    while (reservedDemoUserIds.has(nextId)) {
        nextId++;
    }

    return nextId;
}

export function createUser(user) {
    const transaction = db.transaction(() => {
        const userId = getNextUserId();

        db.prepare(`
            INSERT INTO Users (
                id,
                email,
                password_hash,
                role,
                user_type,
                employee_id
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            userId,
            user.email.trim().toLowerCase(),
            user.passwordHash,
            user.role ?? "student",
            user.userType ?? "student",
            user.employeeId ?? null
        );

        db.prepare(`
            INSERT INTO Profiles (
                user_id,
                first_name,
                last_name,
                phone
            )
            VALUES (?, ?, ?, ?)
        `).run(
            userId,
            user.firstName.trim(),
            user.lastName.trim(),
            user.phone?.trim() ?? ""
        );

        return findUserById(userId);
    });

    return transaction();
}

export function updateUserProfile(id, profile) {
    const transaction = db.transaction(() => {
        const user = findUserById(id);

        if (!user) return null;

        db.prepare(`
            UPDATE Users
            SET email = ?
            WHERE id = ?
        `).run(
            profile.email.trim().toLowerCase(),
            id
        );

        db.prepare(`
            UPDATE Profiles
            SET first_name = ?,
                last_name = ?,
                phone = ?
            WHERE user_id = ?
        `).run(
            profile.firstName.trim(),
            profile.lastName.trim(),
            profile.phone?.trim() ?? "",
            id
        );

        return findUserById(id);
    });

    return transaction();
}
