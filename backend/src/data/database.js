
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const databasePath =
    process.env.DB_PATH ||
    path.join(process.cwd(), "data", "queuesmart.db");

// Create the database directory if it doesn't exist.
if (databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
}

// Open the shared SQLite database.
const db = new Database(databasePath);

// Enable foreign key enforcement.
db.pragma("foreign_keys = ON");

// Improve reliability for concurrent reads.
if (databasePath !== ":memory:") {
    db.pragma("journal_mode = WAL");
}

// Create authentication tables if they don't exist.
db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student'
            CHECK (role IN ('student', 'employee', 'admin')),
        user_type TEXT NOT NULL DEFAULT 'student'
            CHECK (user_type IN ('student', 'applicant', 'staff')),
        employee_id INTEGER UNIQUE
    );

    CREATE TABLE IF NOT EXISTS Profiles (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT NOT NULL DEFAULT '',
        FOREIGN KEY (user_id)
            REFERENCES Users(id)
            ON DELETE CASCADE
    );
`);

export default db;
