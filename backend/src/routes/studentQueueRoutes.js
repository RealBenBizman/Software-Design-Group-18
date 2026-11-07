
import express from "express";
import { store } from "../data/store.js";
import { insertByPriority } from "../utils/queueOrder.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import {
    recordQueueJoined,
    recordQueueFinished
} from "../services/queueActivity.js";

const router = express.Router();

router.use(requireAuth, requireRole("student"));

// Validate service ID.
function isValidServiceID(serviceID) {
    return Number.isSafeInteger(serviceID) && serviceID > 0;
}

// Find a service.
function getService(serviceID) {
    return store.services.find(
        (service) => service.id === serviceID
    );
}

// Find a student's active queue entry.
function findActiveEntry(userID) {
    for (const [serviceID, queue] of Object.entries(store.queues)) {
        const entry = queue.find(
            (item) => item.userId === userID
        );

        if (entry) {
            return {
                serviceID: Number(serviceID),
                entry,
                queue
            };
        }
    }

    return null;
}

// GET /api/queue/services
// Retrieve services and estimated wait times.
router.get("/services", (req, res) => {
    const services = store.services.map((service) => {
        const queue = store.queues[service.id] || [];

        return {
            ...service,
            people: queue.length,
            waitMinutes: queue.length * service.expectedDuration
        };
    });

    return res.json({
        success: true,
        services
    });
});

// POST /api/queue/join
// Join a service queue.
router.post("/join", (req, res) => {
    const { serviceID, priority } = req.body;
    const userID = req.user.id;

    if (!isValidServiceID(serviceID)) {
        return res.status(400).json({
            success: false,
            message: "A valid serviceID is required."
        });
    }

    const service = getService(serviceID);

    if (!service) {
        return res.status(404).json({
            success: false,
            message: "Could not find service."
        });
    }

    if (!service.open) {
        return res.status(409).json({
            success: false,
            message: "This service is currently closed."
        });
    }

    // Students cannot assign themselves elevated priority.
    if (
        priority !== undefined &&
        priority !== "Standard" &&
        priority !== "normal"
    ) {
        return res.status(400).json({
            success: false,
            message: "Students cannot assign elevated priority."
        });
    }

    // Prevent joining multiple queues simultaneously.
    if (findActiveEntry(userID)) {
        return res.status(409).json({
            success: false,
            message: "You already have an active queue entry."
        });
    }

    const joinTime = new Date().toISOString();

    const entry = {
        id: store.nextQueueEntryId++,
        userId: userID,
        name: `${req.user.firstName} ${req.user.lastName}`.trim(),
        joined: new Date().toLocaleTimeString(),
        joinedAt: joinTime,
        status: "waiting",
        priority: "normal"
    };

    // Create the queue if it does not exist.
    if (!store.queues[serviceID]) {
        store.queues[serviceID] = [];
    }

    const queue = store.queues[serviceID];

    // Insert student in the correct queue position.
    insertByPriority(queue, entry);

    // Record queue history and send notifications.
    recordQueueJoined(serviceID, entry);

    const position = queue.findIndex(
        (item) => item.id === entry.id
    ) + 1;

    const aheadPeople = position - 1;
    const estWaitMinutes = aheadPeople * service.expectedDuration;

    return res.status(201).json({
        success: true,
        message: "Successfully joined queue!",
        queueData: {
            queueID: entry.id,
            entryID: entry.id,
            userID,
            userName: entry.name,
            serviceID,
            serviceName: service.name,
            priority: "Standard",
            joinedAt: joinTime,
            position,
            aheadPeople,
            estWaitMinutes,
            queueStatus: "waiting"
        }
    });
});

// POST /api/queue/leave
// Leave an active service queue.
router.post("/leave", (req, res) => {
    const { serviceID } = req.body;
    const userID = req.user.id;

    if (!isValidServiceID(serviceID)) {
        return res.status(400).json({
            success: false,
            message: "A valid serviceID is required."
        });
    }

    const active = findActiveEntry(userID);

    if (!active || active.serviceID !== serviceID) {
        return res.status(404).json({
            success: false,
            message: "Could not find active queue entry."
        });
    }

    const index = active.queue.findIndex(
        (item) => item.id === active.entry.id
    );

    const [removed] = active.queue.splice(index, 1);

    // Update the existing history record.
    recordQueueFinished(serviceID, removed, "left");

    return res.json({
        success: true,
        message: "You have left the queue.",
        removed
    });
});

// GET /api/queue/status/:userID
// Retrieve the authenticated student's queue status.
router.get("/status/:userID", (req, res) => {
    const targetUserID = req.params.userID;
    const userID = req.user.id;

    // Students can only view their own queue status.
    if (
        targetUserID !== "me" &&
        targetUserID !== String(userID)
    ) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to view this status."
        });
    }

    const active = findActiveEntry(userID);

    if (!active) {
        return res.json({
            success: true,
            inQueue: false,
            message: "You are not in a queue."
        });
    }

    const service = getService(active.serviceID);

    const position = active.queue.findIndex(
        (item) => item.id === active.entry.id
    ) + 1;

    const aheadPeople = position - 1;
    const estWaitMinutes = aheadPeople * service.expectedDuration;

    return res.json({
        success: true,
        inQueue: true,
        status: {
            queueID: active.entry.id,
            entryID: active.entry.id,
            userID,
            userName: active.entry.name,
            serviceID: active.serviceID,
            serviceName: service.name,
            priority: "Standard",
            joinedAt: active.entry.joinedAt,
            position,
            aheadPeople,
            estWaitMinutes,
            queueStatus: active.entry.status
        }
    });
});

export default router;
