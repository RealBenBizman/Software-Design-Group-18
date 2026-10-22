import { useState, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminDashboard from "./AdminDashboard";
import AdminQueueManagement from "./AdminQueueManagement";
import ServiceManagement from "./ServiceManagement";
import EmployeeManagement from "./EmployeeManagement";
import Reports from "./Reports";
import "./admin.css";

const API = "http://localhost:3000";
const SERVER_ERROR = "Could not reach the server. Please try again.";

const getErrorMessage = (data) =>
  data.errors?.join(" ") || data.error || "Something went wrong.";

function AdminApp() {
  const [page, setPage] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [queues, setQueues] = useState({});
  const [employees, setEmployees] = useState([]);
  const [reports, setReports] = useState([]);
  const [activity, setActivity] = useState({
    studentsServed: 0,
    appointmentsCompleted: 0,
    noShows: 0,
    averageWait: 0,
  });
  const [viewingServiceId, setViewingServiceId] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    // throws on a network failure or a non-2xx response
    async function getJson(path) {
      const res = await fetch(`${API}${path}`);
      if (!res.ok) {
        throw new Error(`${path} returned ${res.status}`);
      }
      return res.json();
    }

    async function loadAll() {
      try {
        const servicesData = await getJson("/api/services");
        setServices(servicesData);

        const queueEntries = await Promise.all(
          servicesData.map(async (service) => {
            const data = await getJson(`/api/queues/${service.id}`);
            return [service.id, data.queue];
          })
        );
        setQueues(Object.fromEntries(queueEntries));

        setEmployees(await getJson("/api/employees"));
        setReports(await getJson("/api/reports"));

        const dashData = await getJson("/api/dashboard/admin");
        setActivity({ ...dashData.activity, averageWait: 0 });
      } catch (error) {
        console.error("failed to load admin data:", error);
        setLoadError(SERVER_ERROR);
      }
    }

    loadAll();
  }, []);

  const toggleQueue = async (serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    const res = await fetch(`${API}/api/services/${serviceId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ open: !service.open }),
    });
    const updated = await res.json();
    if (res.ok) {
      setServices((current) =>
        current.map((s) => (s.id === serviceId ? updated : s))
      );
    }
  };

  const openQueuePage = (serviceId) => {
    setViewingServiceId(serviceId);
    setPage("queues");
  };

  const serveNext = async (serviceId) => {
    const res = await fetch(`${API}/api/queues/${serviceId}/serve-next`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "admin" }),
    });
    const data = await res.json();
    if (res.ok) {
      setQueues((current) => ({ ...current, [serviceId]: data.queue }));
    }
  };

  const removeStudent = async (serviceId, studentId) => {
    const res = await fetch(
      `${API}/api/queues/${serviceId}/users/${studentId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "admin" }),
      }
    );
    const data = await res.json();
    if (res.ok) {
      setQueues((current) => ({ ...current, [serviceId]: data.queue }));
    }
  };

  const moveStudent = async (serviceId, index, direction) => {
    const queue = queues[serviceId] || [];
    const toIndex = direction === "up" ? index - 1 : index + 1;

    if (toIndex < 0 || toIndex >= queue.length) {
      return;
    }

    const res = await fetch(`${API}/api/queues/${serviceId}/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "admin", fromIndex: index, toIndex }),
    });
    const data = await res.json();
    if (res.ok) {
      setQueues((current) => ({ ...current, [serviceId]: data }));
    }
  };

  const updateStudentStatus = async (serviceId, studentId, status) => {
    const res = await fetch(
      `${API}/api/queues/${serviceId}/users/${studentId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "admin", status }),
      }
    );
    const updated = await res.json();
    if (res.ok) {
      setQueues((current) => ({
        ...current,
        [serviceId]: current[serviceId].map((student) =>
          student.id === studentId ? updated : student
        ),
      }));
    }
  };

  // add/edit return { ok, error } so the forms only show success when it worked
  const addService = async (serviceData) => {
    try {
      const res = await fetch(`${API}/api/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceData),
      });
      const newService = await res.json();
      if (!res.ok) {
        return { ok: false, error: getErrorMessage(newService) };
      }
      setServices((current) => [...current, newService]);
      setQueues((current) => ({ ...current, [newService.id]: [] }));
      return { ok: true };
    } catch {
      return { ok: false, error: SERVER_ERROR };
    }
  };

  const editService = async (serviceId, serviceData) => {
    try {
      const res = await fetch(`${API}/api/services/${serviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceData),
      });
      const updated = await res.json();
      if (!res.ok) {
        return { ok: false, error: getErrorMessage(updated) };
      }
      setServices((current) =>
        current.map((s) => (s.id === serviceId ? updated : s))
      );
      return { ok: true };
    } catch {
      return { ok: false, error: SERVER_ERROR };
    }
  };

  const addEmployee = async (employeeData) => {
    try {
      const res = await fetch(`${API}/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeeData),
      });
      const newEmployee = await res.json();
      if (!res.ok) {
        return { ok: false, error: getErrorMessage(newEmployee) };
      }
      setEmployees((current) => [...current, newEmployee]);
      return { ok: true };
    } catch {
      return { ok: false, error: SERVER_ERROR };
    }
  };

  const updateReportStatus = async (reportId, status) => {
    const res = await fetch(`${API}/api/reports/${reportId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated = await res.json();
    if (res.ok) {
      setReports((current) =>
        current.map((r) => (r.id === reportId ? updated : r))
      );
    }
  };

  const renderPage = () => {
    if (page === "queues") {
      return (
        <AdminQueueManagement
          services={services}
          queues={queues}
          viewingServiceId={viewingServiceId}
          setViewingServiceId={setViewingServiceId}
          onToggleQueue={toggleQueue}
          onServeNext={serveNext}
          onRemove={removeStudent}
          onMove={moveStudent}
          onUpdateStatus={updateStudentStatus}
        />
      );
    }

    if (page === "services") {
      return (
        <ServiceManagement
          services={services}
          onAddService={addService}
          onEditService={editService}
        />
      );
    }

    if (page === "employees") {
      return (
        <EmployeeManagement
          employees={employees}
          services={services}
          onAddEmployee={addEmployee}
        />
      );
    }

    if (page === "reports") {
      return (
        <Reports
          reports={reports}
          activity={activity}
          onUpdateReportStatus={updateReportStatus}
        />
      );
    }

    return (
      <AdminDashboard
        services={services}
        queues={queues}
        employees={employees}
        activity={activity}
        onToggleQueue={toggleQueue}
        onManageQueue={openQueuePage}
        onGoToServices={() => setPage("services")}
        onGoToEmployees={() => setPage("employees")}
        onGoToReports={() => setPage("reports")}
      />
    );
  };

  return (
    <div className="admin-app">
      <AdminSidebar
        page={page}
        setPage={setPage}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      <main className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-mobile-menu"
            onClick={() => setMenuOpen(true)}
            aria-label="open menu"
          >
            ☰
          </button>

          <div className="admin-mobile-brand">
            <span>administrator portal</span>
            <strong>NEBB Queue</strong>
          </div>

          <div className="admin-profile">
            <span>AD</span>
            <div>
              <strong>Admin User</strong>
              <small>Administrator</small>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {loadError && (
            <div className="admin-form-error admin-load-error">
              <span>{loadError}</span>
              <button
                className="admin-button-light"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          )}
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default AdminApp;
