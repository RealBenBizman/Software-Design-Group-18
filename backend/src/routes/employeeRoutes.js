import express from "express";
import { store } from "../data/store.js";
import { validateEmployee } from "../utils/validation.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json(store.employees);
});

router.post("/", (req, res) => {
  const errors = validateEmployee(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const duplicate = store.employees.some(
    (employee) =>
      employee.email.toLowerCase() === req.body.email.toLowerCase()
  );

  if (duplicate) {
    return res.status(409).json({ error: "employee email already exists" });
  }

  const nextId =
    store.employees.length > 0
      ? Math.max(...store.employees.map((employee) => employee.id)) + 1
      : 1;

  const employee = {
    id: nextId,
    firstName: req.body.firstName.trim(),
    lastName: req.body.lastName.trim(),
    email: req.body.email.trim(),
    phone: req.body.phone.trim(),
    role: "employee",
    serviceId: null,
    status: "offline"
  };

  store.employees.push(employee);
  res.status(201).json(employee);
});

router.patch("/:id/service", (req, res) => {
  const employeeId = Number(req.params.id);
  const serviceId = Number(req.body.serviceId);

  const employee = store.employees.find((item) => item.id === employeeId);
  const service = store.services.find((item) => item.id === serviceId);

  if (!employee) {
    return res.status(404).json({ error: "employee not found" });
  }

  if (!service) {
    return res.status(404).json({ error: "service not found" });
  }

  employee.serviceId = serviceId;
  employee.status = "working";

  res.json(employee);
});

router.patch("/:id/clock-out", (req, res) => {
  const employeeId = Number(req.params.id);
  const employee = store.employees.find((item) => item.id === employeeId);

  if (!employee) {
    return res.status(404).json({ error: "employee not found" });
  }

  employee.serviceId = null;
  employee.status = "offline";

  res.json(employee);
});

export default router;