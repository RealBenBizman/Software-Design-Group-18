import express from "express";
import cors from "cors";
import serviceRoutes from "./routes/serviceRoutes.js";
import queueRoutes from "./routes/queueRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173"
  })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ message: "queuesmart backend is running" });
});

app.use("/api/services", serviceRoutes);
app.use("/api/queues", queueRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "route not found" });
});

export default app;