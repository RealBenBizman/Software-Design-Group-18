
import express from "express";
import bcrypt from "bcryptjs";

import { store } from "../data/store.js";
import { findUserByEmail } from "../data/userRepository.js";
import { findServiceById } from "../data/serviceRepository.js";
import {
  listEmployees,
  findEmployeeById,
  createEmployee,
  assignService,
  clockOut
} from "../data/employeeRepository.js";

import { validateEmployee, isValidId } from "../utils/validation.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { requireEmployeeAccess } from "../middleware/staffAccess.js";

const router = express.Router();

router.use(requireAuth, requireRole("admin", "employee"));

// Get all employees (admin only)
router.get("/", requireRole("admin"), (req, res) => {
  res.json(listEmployees());
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

  // The A3 demo employees only exist in the store, so check both.
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

  try {
    return res.status(201).json(createEmployee(req.body, passwordHash));
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        error: "employee email already exists"
      });
    }

    throw error;
  }
});

// Assign an employee to a service
router.patch("/:id/service", requireEmployeeAccess, (req, res) => {
  const serviceId = req.body.serviceId;

  if (!isValidId(serviceId)) {
    return res.status(400).json({
      error: "serviceId must be a positive integer"
    });
  }

  if (!findServiceById(serviceId)) {
    return res.status(404).json({
      error: "service not found"
    });
  }

  const assignment = assignService(req.employee.id, serviceId);

  res.json(employeeResponse(req.employee, assignment));
});

// Clock an employee out
router.patch("/:id/clock-out", requireEmployeeAccess, (req, res) => {
  const assignment = clockOut(req.employee.id);

  res.json(employeeResponse(req.employee, assignment));
});

// Prefer the saved account profile, and fall back to the A3 demo record.
function employeeResponse(employee, assignment) {
  return { ...employee, ...findEmployeeById(employee.id), ...assignment };
}

export default router;
