import sqlite3 from 'sqlite3';
import {open} from 'sqlite';
import path from 'path';
import {fileURLToPath} from 'url';
const __filename=fileURLToPath(import.meta.url);
const __dirname= path.dirname(__filename);

let dbInstance=null;
export async function getDb()
{
    if (!dbInstance)
    {
        dbInstance=await open ({
            filename:path.join(__dirname,'database.sqlite'),
            driver:sqlite3.Database
        });
        await dbInstance.exec('PRAGMA foreign_keys=ON;');
    }
    return dbInstance;
}

export async function initializeDatabase()
{
    const db=await open ({
        filename:path.join(__dirname,'database.sqlite'),
        driver: sqlite3.Database
    });

    await db.exec('PRAGMA foreign_keys= ON;');

    //User Credentials 
    await db.exec(`
        CREATE TABLE IF NOT EXISTS UserCredentials
        (userID TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
        );
    `);
    
    //User Profile
    await db.exec(`
        CREATE TABLE IF NOT EXISTS UserProfile
        (email TEXT PRIMARY KEY,
        fullName TEXT NOT NULL,
        contactInfo TEXT,
        preferences TEXT,
        FOREIGN KEY (email) REFERENCES UserCredentials(email) ON DELETE CASCADE
        );
    `);

    // Service 
    await db.exec(`
        CREATE TABLE IF NOT EXISTS Service
        (ServiceID TEXT PRIMARY KEY,
        serviceName TEXT NOT NULL,
        description TEXT,
        expectedDuration INTEGER,
        priority TEXT);
    `);
    
    // Queue
    await db.exec(`
        CREATE TABLE IF NOT EXISTS Queue
        (queueID TEXT PRIMARY KEY,
        serviceID TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (serviceID) REFERENCES Service(serviceID) ON DELETE CASCADE);
    `);

    //Queue Entry
    await db.exec(`
        CREATE TABLE IF NOT EXISTS QueueEntry
        (entryID INTEGER PRIMARY KEY AUTOINCREMENT,
        queueID TEXT NOT NULL,
        userID TEXT NOT NULL,
        serviceID TEXT NOT NULL,
        priority TEXT,
        joinTime TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (queueID) REFERENCES Queue(queueID) ON DELETE CASCADE,
        FOREIGN KEY (userID) REFERENCES UserCredentials(userID) ON DELETE CASCADE);
    `);

    // Notification History
    await db.exec(`
        CREATE TABLE IF NOT EXISTS NotificationHistory
        (notifID INTEGER PRIMARY KEY AUTOINCREMENT,
        userID TEXT NOT NULL,
        message TEXT NOT NULL,
        timeStamp TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (userID) REFERENCES UserCredentials(userID) ON DELETE CASCADE);
    `);

    console.log("Database initialazed successfully.");
    return db;
}