import { store } from "../data/store.js";

export function canManageService(user, serviceId) {
  if (user.role === "admin") return true;
  return user.role === "employee" && store.employees.some((employee) =>
    employee.id === user.employeeId && employee.serviceId === serviceId && employee.status === "working"
  );
}

export function requireEmployeeAccess(req, res, next) {
  const parameter = req.params.employeeId ?? req.params.id;
  const employeeId = parameter === "me" ? req.user.employeeId : Number(parameter);
  if (req.user.role !== "admin" && employeeId !== req.user.employeeId) {
    return res.status(403).json({ error: "you cannot manage another employee" });
  }
  const employee = store.employees.find((item) => item.id === employeeId);
  if (!employee) {
    return res.status(404).json({ error: "employee not found" });
  }
  req.employee = employee;
  next();
}
