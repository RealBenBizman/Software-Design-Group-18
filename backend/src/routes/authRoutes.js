
const express = require("express");

const {
    register,
    login,
    getCurrentUser,
    logout
} = require("../controllers/authController");

const {
    requireAuth
} = require("../middleware/authMiddleware");

const router = express.Router();

// Public authentication endpoints
router.post("/register", register);
router.post("/login", login);

// Session-protected endpoint
router.get("/me", requireAuth, getCurrentUser);

// Logout
router.post("/logout", logout);

module.exports = router;
