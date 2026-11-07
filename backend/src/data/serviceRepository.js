import db from "./database.js";
import { store } from "./store.js";

// The Service and Queue tables are created in database.js.
const startingServices = [
    {
        id: 1,
        name: "FAFSA & Application Help",
        description: "FAFSA questions, missing documents, verification requirements, application status, and general financial aid guidance.",
        expectedDuration: 20,
        priority: "high",
        open: true
    },
    {
        id: 2,
        name: "Scholarships & Grants",
        description: "University scholarships, grants, eligibility requirements, deadlines, and award status.",
        expectedDuration: 20,
        priority: "medium",
        open: true
    },
    {
        id: 3,
        name: "Loans & Counseling",
        description: "Student loans, loan limits, counseling, and repayment questions.",
        expectedDuration: 30,
        priority: "medium",
        open: true
    },
    {
        id: 4,
        name: "Awards & Disbursement",
        description: "Aid offers, disbursement, refunds, holds, balances, and account issues.",
        expectedDuration: 20,
        priority: "high",
        open: false
    }
];

// Each service has one Queue row. Its status says if the queue is open.
const queueId = (serviceId) => `q-${serviceId}`;

const serviceSelect = `
    SELECT
        s.serviceID,
        s.serviceName,
        s.description,
        s.expectedDuration,
        s.priority,
        q.status AS queueStatus
    FROM Service s
    LEFT JOIN Queue q ON q.queueID = 'q-' || s.serviceID
`;

function mapService(row) {
    if (!row) return null;

    return {
        id: Number(row.serviceID),
        name: row.serviceName,
        description: row.description,
        expectedDuration: row.expectedDuration,
        priority: row.priority,
        open: row.queueStatus === "open"
    };
}

// serviceID is a TEXT column, so ids are always bound as strings.
function setQueueStatus(serviceId, open) {
    db.prepare(`
        INSERT INTO Queue (queueID, serviceID, status, createdAt)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(queueID) DO UPDATE SET status = excluded.status
    `).run(
        queueId(serviceId),
        String(serviceId),
        open ? "open" : "closed",
        new Date().toISOString()
    );
}

function insertService(id, data) {
    db.prepare(`
        INSERT INTO Service (
            serviceID,
            serviceName,
            description,
            expectedDuration,
            priority
        )
        VALUES (?, ?, ?, ?, ?)
    `).run(
        String(id),
        data.name.trim(),
        data.description.trim(),
        data.expectedDuration,
        data.priority
    );
}

// Student queue, history and notification code still read store.services,
// so every saved change is copied there until they move to SQLite.
function syncStore(service) {
    const existing = store.services.find((item) => item.id === service.id);

    if (existing) {
        Object.assign(existing, service);
    } else {
        store.services.push({ ...service });
        store.queues[service.id] ??= [];
    }
}

export function listServices() {
    return db.prepare(`
        ${serviceSelect}
        ORDER BY CAST(s.serviceID AS INTEGER)
    `).all().map(mapService);
}

export function findServiceById(id) {
    const row = db.prepare(`
        ${serviceSelect}
        WHERE s.serviceID = ?
    `).get(String(id));

    return mapService(row);
}

export function countServices() {
    return db.prepare("SELECT COUNT(*) AS count FROM Service").get().count;
}

export function countOpenQueues() {
    return db.prepare(`
        SELECT COUNT(*) AS count
        FROM Queue q
        JOIN Service s ON s.serviceID = q.serviceID
        WHERE q.status = 'open'
    `).get().count;
}

export function createService(data) {
    const create = db.transaction(() => {
        const { nextId } = db.prepare(`
            SELECT COALESCE(MAX(CAST(serviceID AS INTEGER)), 0) + 1 AS nextId
            FROM Service
        `).get();

        insertService(nextId, data);
        setQueueStatus(nextId, false);

        return findServiceById(nextId);
    });

    const service = create();
    syncStore(service);
    return service;
}

export function updateService(id, data) {
    const result = db.prepare(`
        UPDATE Service
        SET serviceName = ?,
            description = ?,
            expectedDuration = ?,
            priority = ?
        WHERE serviceID = ?
    `).run(
        data.name.trim(),
        data.description.trim(),
        data.expectedDuration,
        data.priority,
        String(id)
    );

    if (result.changes === 0) return null;

    const service = findServiceById(id);
    syncStore(service);
    return service;
}

export function setServiceOpen(id, open) {
    if (!findServiceById(id)) return null;

    setQueueStatus(id, open);

    const service = findServiceById(id);
    syncStore(service);
    return service;
}

// Add the starting services only when the table is empty.
export function seedServices() {
    const { count } = db.prepare("SELECT COUNT(*) AS count FROM Service").get();

    if (count > 0) return;

    db.transaction(() => {
        for (const service of startingServices) {
            insertService(service.id, service);
            setQueueStatus(service.id, service.open);
        }
    })();
}

// Used by tests to put the service data back to the starting rows.
export function resetServices() {
    db.prepare("DELETE FROM Service").run();
    seedServices();
}

seedServices();
listServices().forEach(syncStore);
