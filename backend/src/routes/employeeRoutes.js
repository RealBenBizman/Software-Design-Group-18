
import express from "express";
import bcrypt from "bcryptjs";

import { store } from "../data/store.js";
import {
  createUser,
  findUserByEmail
} from "../data/userRepository.js";

import { validateEmployee } from "../utils/validation.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { requireEmployeeAccess } from "../middleware/staffAccess.js";

const router = express.Router();

router.use(requireAuth, requireRole("admin", "employee"));

// Get all employees (admin only)
router.get("/", requireRole("admin"), (req, res) => {
  res.json(store.employees);
});

// Create a new employee (admin only)
router.post("/", requireRole("admin"), async (req, res) => {
  const errors = validateEmployee(req.body);

  if (
    typeof req.body.password !== "string" ||
    req.body.password.length < 8 ||
    req.body.password.length > 128
  ) {
    errors.push("password must be between 8 and 128 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const email = req.body.email.trim().toLowerCase();

  // Check both existing employee records and SQLite accounts.
  const duplicateEmail = () =>
    store.employees.some(
      (employee) => employee.email.toLowerCase() === email
    ) || findUserByEmail(email) !== null;

  if (duplicateEmail()) {
    return res.status(409).json({
      error: "employee email already exists"
    });
  }

  const passwordHash = await bcrypt.hash(req.body.password, 10);

  // Check again after the asynchronous password hashing.
  if (duplicateEmail()) {
    return res.status(409).json({
      error: "employee email already exists"
    });
  }

  const nextId =
    store.employees.length > 0
      ? Math.max(...store.employees.map((employee) => employee.id)) + 1
      : 1;

  const employee = {
    id: nextId,
    firstName: req.body.firstName.trim(),
    lastName: req.body.lastName.trim(),
    email,
    phone: req.body.phone.trim(),
    role: "employee",
    serviceId: null,
    status: "offline"
  };

  try {
    // Store employee login credentials and profile in SQLite.
    createUser({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      passwordHash,
      userType: "staff",
      role: "employee",
      employeeId: employee.id
    });
  } catch (error) {
    // SQLite enforces unique emails and employee associations.
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        error: "employee email already exists"
      });
    }

    throw error;
  }

  // Preserve the existing employee management functionality.
  store.employees.push(employee);

  return res.status(201).json(employee);
});

// Assign an employee to a service
router.patch("/:id/service", requireEmployeeAccess, (req, res) => {
  const employee = req.employee;
  const serviceId = req.body.serviceId;

  if (!Number.isInteger(serviceId) || serviceId < 1) {
    return res.status(400).json({
      error: "serviceId must be a positive integer"
    });
  }

  const service = store.services.find(
    (item) => item.id === serviceId
  );

  if (!service) {
    return res.status(404).json({
      error: "service not found"
    });
  }

  employee.serviceId = serviceId;
  employee.status = "working";

  res.json(employee);
});

// Clock an employee out
router.patch("/:id/clock-out", requireEmployeeAccess, (req, res) => {
  const employee = req.employee;

  employee.serviceId = null;
  employee.status = "offline";

  res.json(employee);
});

export default router;
