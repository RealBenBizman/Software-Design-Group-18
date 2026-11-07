import db from "./database.js";
import { store } from "./store.js";
import { createUser } from "./userRepository.js";
import "./serviceRepository.js";

// Names, email and password stay in Users/Profiles.
// This table only stores which service an employee works and if they are working.
db.exec(`
    CREATE TABLE IF NOT EXISTS Employee (
        id INTEGER PRIMARY KEY,
        service_id TEXT,
        status TEXT NOT NULL DEFAULT 'offline'
            CHECK (status IN ('working', 'offline')),
        FOREIGN KEY (service_id)
            REFERENCES Service(serviceID)
            ON DELETE SET NULL
    );
`);

const startingAssignments = [
    { id: 1, serviceId: 1, status: "working" },
    { id: 2, serviceId: 2, status: "working" },
    { id: 3, serviceId: null, status: "offline" }
];

const employeeSelect = `
    SELECT
        u.employee_id AS id,
        u.email,
        p.first_name,
        p.last_name,
        p.phone,
        e.service_id,
        COALESCE(e.status, 'offline') AS status
    FROM Users u
    JOIN Profiles p ON p.user_id = u.id
    LEFT JOIN Employee e ON e.id = u.employee_id
    WHERE u.role = 'employee'
      AND u.employee_id IS NOT NULL
`;

function mapEmployee(row) {
    if (!row) return null;

    return {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        phone: row.phone,
        role: "employee",
        serviceId: row.service_id === null ? null : Number(row.service_id),
        status: row.status
    };
}

// Ben's staffAccess.js still checks store.employees, so keep it in sync.
function syncStore(employeeId, fields) {
    const existing = store.employees.find((item) => item.id === employeeId);

    if (existing) {
        Object.assign(existing, fields);
    } else if (fields.email) {
        store.employees.push({ ...fields });
    }
}

function saveAssignment(employeeId, serviceId, status) {
    db.prepare(`
        INSERT INTO Employee (id, service_id, status)
        VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            service_id = excluded.service_id,
            status = excluded.status
    `).run(
        employeeId,
        serviceId === null ? null : String(serviceId),
        status
    );

    const assignment = getAssignment(employeeId);
    syncStore(employeeId, assignment);
    return assignment;
}

export function listEmployees() {
    return db.prepare(`
        ${employeeSelect}
        ORDER BY u.employee_id
    `).all().map(mapEmployee);
}

export function findEmployeeById(id) {
    const row = db.prepare(`
        ${employeeSelect}
        AND u.employee_id = ?
    `).get(id);

    return mapEmployee(row);
}

export function getAssignment(id) {
    const row = db.prepare(`
        SELECT service_id, status
        FROM Employee
        WHERE id = ?
    `).get(id);

    if (!row) return { serviceId: null, status: "offline" };

    return {
        serviceId: row.service_id === null ? null : Number(row.service_id),
        status: row.status
    };
}

export function countWorkingEmployees() {
    return db.prepare(`
        SELECT COUNT(*) AS count
        FROM Employee
        WHERE status = 'working'
    `).get().count;
}

export function assignService(employeeId, serviceId) {
    return saveAssignment(employeeId, serviceId, "working");
}

export function clockOut(employeeId) {
    return saveAssignment(employeeId, null, "offline");
}

// Create the login through Nathaniel's createUser and the Employee row together.
export function createEmployee(data, passwordHash) {
    const create = db.transaction(() => {
        const { nextId } = db.prepare(`
            SELECT MAX(
                (SELECT COALESCE(MAX(id), 0) FROM Employee),
                (SELECT COALESCE(MAX(employee_id), 0) FROM Users)
            ) + 1 AS nextId
        `).get();

        db.prepare(`
            INSERT INTO Employee (id, service_id, status)
            VALUES (?, NULL, 'offline')
        `).run(nextId);

        createUser({
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email: data.email.trim().toLowerCase(),
            phone: data.phone.trim(),
            passwordHash,
            userType: "staff",
            role: "employee",
            employeeId: nextId
        });

        return findEmployeeById(nextId);
    });

    const employee = create();
    syncStore(employee.id, employee);
    return employee;
}

export function seedEmployees() {
    const { count } = db.prepare("SELECT COUNT(*) AS count FROM Employee").get();

    if (count > 0) return;

    db.transaction(() => {
        for (const item of startingAssignments) {
            db.prepare(`
                INSERT INTO Employee (id, service_id, status)
                VALUES (?, ?, ?)
            `).run(
                item.id,
                item.serviceId === null ? null : String(item.serviceId),
                item.status
            );
        }
    })();
}

// Used by tests to put the employee assignments back to the starting rows.
export function resetEmployees() {
    db.prepare("DELETE FROM Employee").run();
    seedEmployees();
}

// Copy saved assignments into the store when the backend starts.
export function loadEmployeesIntoStore() {
    for (const row of db.prepare("SELECT id FROM Employee").all()) {
        syncStore(row.id, getAssignment(row.id));
    }

    for (const employee of listEmployees()) {
        syncStore(employee.id, employee);
    }
}

seedEmployees();
loadEmployeesIntoStore();
