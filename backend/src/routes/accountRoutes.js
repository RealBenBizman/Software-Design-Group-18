import express from "express";
import users from "../data/users.js";
import { store } from "../data/store.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(requireAuth);

const times = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM"];
const officeDate = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
const validText = (value, limit) => typeof value === "string" && value.trim().length > 0 && value.trim().length <= limit;

router.patch("/profile", (req, res) => {
  const { firstName, lastName, email, phone = "" } = req.body;
  if (!validText(firstName, 50) || !validText(lastName, 50) || !validText(email, 254) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof phone !== "string" ||
      (phone !== "" && !/^[0-9()+.\s-]{7,20}$/.test(phone.trim()))) {
    return res.status(400).json({ error: "Enter valid names, email, and phone number within the field limits." });
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (users.some((user) => user.id !== req.user.id && user.email === normalizedEmail) ||
      (req.user.role === "employee" && store.employees.some((employee) =>
        employee.id !== req.user.employeeId && employee.email.toLowerCase() === normalizedEmail))) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }
  const account = users.find((user) => user.id === req.user.id);
  const profile = { firstName: firstName.trim(), lastName: lastName.trim(), email: normalizedEmail, phone: phone.trim() };
  Object.assign(account, profile);
  const employee = store.employees.find((item) => item.id === account.employeeId);
  if (employee) Object.assign(employee, profile);
  for (const entry of [...Object.values(store.queues).flat(), ...store.appointments]) {
    if (entry.userId === account.id) entry.name = `${profile.firstName} ${profile.lastName}`;
  }
  res.json({ user: { id: account.id, ...profile, role: account.role, userType: account.userType } });
});

router.get("/appointment-options", requireRole("student"), (req, res) => {
  const tomorrow = new Date(`${officeDate()}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  res.json({ services: store.services, times, minDate: tomorrow.toISOString().slice(0, 10) });
});

router.get("/appointments", requireRole("student"), (req, res) => {
  const appointments = store.appointments.filter((item) => item.userId === req.user.id)
    .map((item) => ({ ...item, service: store.services.find((service) => service.id === item.serviceId)?.name || "Unavailable service" }));
  res.json(appointments);
});

router.post("/appointments", requireRole("student"), (req, res) => {
  const { serviceId, date, time } = req.body;
  if (!Number.isSafeInteger(serviceId) || serviceId < 1 || typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) || !times.includes(time)) {
    return res.status(400).json({ error: "Select a valid service, future date, and appointment time." });
  }
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || date <= officeDate()) {
    return res.status(400).json({ error: "Appointments must use a valid future date." });
  }
  const service = store.services.find((item) => item.id === serviceId);
  if (!service) return res.status(404).json({ error: "Service not found." });
  const conflict = store.appointments.some((item) =>
    item.date === date && item.time === time &&
    (item.serviceId === serviceId || item.userId === req.user.id) &&
    ["upcoming", "checked in"].includes(item.status));
  if (conflict) return res.status(409).json({ error: "That time is already booked. Choose another appointment time." });
  const appointment = {
    id: Math.max(0, ...store.appointments.map((item) => item.id)) + 1,
    userId: req.user.id, serviceId, name: `${req.user.firstName} ${req.user.lastName}`,
    date, time, status: "upcoming"
  };
  store.appointments.push(appointment);
  res.status(201).json({ ...appointment, service: service.name });
});

router.delete("/appointments/:id", requireRole("student"), (req, res) => {
  const index = store.appointments.findIndex((item) => item.id === Number(req.params.id) && item.userId === req.user.id);
  if (index === -1) return res.status(404).json({ error: "Appointment not found." });
  if (store.appointments[index].status !== "upcoming") {
    return res.status(409).json({ error: "Only upcoming appointments can be cancelled." });
  }
  store.appointments.splice(index, 1);
  res.json({ message: "Appointment cancelled." });
});

router.post("/reports", (req, res) => {
  const { issueType, subject, description } = req.body;
  const categories = { system: "System Issue", employee: "Employee Issue", service: "Service" };
  if (typeof issueType !== "string" || !Object.hasOwn(categories, issueType) || !validText(subject, 100) || !validText(description, 1000)) {
    return res.status(400).json({ error: "Choose an issue type, a subject up to 100 characters, and a description up to 1,000 characters." });
  }
  const report = {
    id: Math.max(0, ...store.reports.map((item) => item.id)) + 1,
    userId: req.user.id, user: `${req.user.firstName} ${req.user.lastName}`,
    date: officeDate(), category: categories[issueType], subject: subject.trim(),
    description: description.trim(), status: "open"
  };
  store.reports.push(report);
  res.status(201).json(report);
});

export default router;
