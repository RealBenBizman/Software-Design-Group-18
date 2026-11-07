
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

// Initialize authentication, service, queue, and notification tables.
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

    CREATE TABLE IF NOT EXISTS Service (
        serviceID TEXT PRIMARY KEY,
        serviceName TEXT NOT NULL,
        description TEXT,
        expectedDuration INTEGER,
        priority TEXT
    );

    CREATE TABLE IF NOT EXISTS Queue (
        queueID TEXT PRIMARY KEY,
        serviceID TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (serviceID)
            REFERENCES Service(serviceID)
            ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS QueueEntry (
        entryID INTEGER PRIMARY KEY AUTOINCREMENT,
        queueID TEXT NOT NULL,
        userID INTEGER NOT NULL,
        serviceID TEXT NOT NULL,
        priority TEXT,
        joinTime TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (queueID)
            REFERENCES Queue(queueID)
            ON DELETE CASCADE,
        FOREIGN KEY (userID)
            REFERENCES Users(id)
            ON DELETE CASCADE,
        FOREIGN KEY (serviceID)
            REFERENCES Service(serviceID)
    );

    CREATE TABLE IF NOT EXISTS NotificationHistory (
        notifID INTEGER PRIMARY KEY AUTOINCREMENT,
        userID INTEGER NOT NULL,
        message TEXT NOT NULL,
        timeStamp TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (userID)
            REFERENCES Users(id)
            ON DELETE CASCADE
    );
`);

export default db;
