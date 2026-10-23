import express from "express";
import { store } from "../data/store.js";
import { estimateWait } from "../utils/waitTime.js";

const router = express.Router();

router.get("/admin", (req, res) => {
  const studentsWaiting = Object.values(store.queues).reduce(
    (total, queue) => total + queue.length,
    0
  );

  const openQueues = store.services.filter(
    (service) => service.open
  ).length;

  const employeesWorking = store.employees.filter(
    (employee) => employee.status === "working"
  ).length;

  res.json({
    activeServices: store.services.length,
    openQueues,
    studentsWaiting,
    employeesWorking,
    activity: store.activity
  });
});

router.get("/employee/:employeeId", (req, res) => {
  const employeeId = Number(req.params.employeeId);

  const employee = store.employees.find(
    (item) => item.id === employeeId
  );

  if (!employee) {
    return res.status(404).json({ error: "employee not found" });
  }

  if (!employee.serviceId) {
    return res.json({
      employee,
      service: null,
      queue: [],
      appointments: [],
      estimatedWait: 0
    });
  }

  const service = store.services.find(
    (item) => item.id === employee.serviceId
  );

  const queue = store.queues[employee.serviceId] || [];

  const appointments = store.appointments.filter(
    (appointment) => appointment.serviceId === employee.serviceId
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