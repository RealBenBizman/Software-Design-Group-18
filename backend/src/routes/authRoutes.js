
import express from "express";

import {
  register,
  login,
  getCurrentUser,
  logout
} from "../controllers/authController.js";

import {
  requireAuth
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Register a new student or applicant
router.post("/register", register);

// Login for students, employees, and admins
router.post("/login", login);

// Get the currently authenticated user
router.get("/me", requireAuth, getCurrentUser);

// Logout and destroy the session
router.post("/logout", logout);

export default router;
