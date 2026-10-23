
import express from "express";
import cors from "cors";
import session from "express-session";
import crypto from "node:crypto";

// Your authentication routes
import authRoutes from "./routes/authRoutes.js";

// Your teammates' API routes
import serviceRoutes from "./routes/serviceRoutes.js";
import queueRoutes from "./routes/queueRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

const app = express();

// Allow the React frontend to send session cookies
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);

// Parse JSON requests
app.use(express.json());

// Configure authentication sessions
const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET;

if (isProduction && !sessionSecret) {
  throw new Error("SESSION_SECRET is required in production");
}

app.use(
  session({
    name: "nebb.sid",
    secret: sessionSecret || crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 2
    }
  })
);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "QueueSmart backend is running"
  });
});

// Authentication API
app.use("/api/auth", authRoutes);

// Existing team APIs
app.use("/api/services", serviceRoutes);
app.use("/api/queues", queueRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: "route not found"
  });
});

export default app;
