import express from "express";
import { store } from "../data/store.js";
import {
  listServices,
  findServiceById,
  countServices,
  countOpenQueues
} from "../data/serviceRepository.js";
import {
  findEmployeeById,
  getAssignment,
  countWorkingEmployees
} from "../data/employeeRepository.js";
import { estimateWait } from "../utils/waitTime.js";

import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { requireEmployeeAccess } from "../middleware/staffAccess.js";

const router = express.Router();
router.use(requireAuth, requireRole("admin", "employee"));

// Queue entries are still kept in store.queues by the student queue routes.
const queueFor = (serviceId) => store.queues[serviceId] || [];

router.get("/admin", requireRole("admin"), (req, res) => {
  const services = listServices();

  const studentsWaiting = services.reduce(
    (total, service) => total + queueFor(service.id).length,
    0
  );

  const totalWait = services.reduce((total, service) =>
    total + queueFor(service.id).reduce((sum, entry, index) =>
      sum + estimateWait(index + 1, service.expectedDuration), 0), 0);

  res.json({
    activeServices: countServices(),
    openQueues: countOpenQueues(),
    studentsWaiting,
    employeesWorking: countWorkingEmployees(),
    activity: {
      ...store.activity,
      averageWait: studentsWaiting ? Math.round(totalWait / studentsWaiting) : 0
    }
  });
});

router.get("/employee/:employeeId", requireEmployeeAccess, (req, res) => {
  const employeeId = req.employee.id;
  const employee = {
    ...req.employee,
    ...findEmployeeById(employeeId),
    ...getAssignment(employeeId)
  };

  const service = employee.serviceId ? findServiceById(employee.serviceId) : null;

  if (!service) {
    return res.json({
      employee,
      service: null,
      queue: [],
      appointments: [],
      estimatedWait: 0
    });
  }

  const queue = queueFor(service.id);

  const appointments = store.appointments.filter(
    (appointment) => appointment.serviceId === service.id
  );

  res.json({
    employee,
    service,
    queue,
    appointments,
    // wait for a student who joins now, at position queue.length + 1
    estimatedWait: estimateWait(queue.length + 1, service.expectedDuration)
  });
});

export default router;
