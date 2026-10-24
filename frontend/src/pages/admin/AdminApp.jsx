
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../utils/api";

import AdminSidebar from "./AdminSidebar";
import AdminDashboard from "./AdminDashboard";
import AdminQueueManagement from "./AdminQueueManagement";
import ServiceManagement from "./ServiceManagement";
import EmployeeManagement from "./EmployeeManagement";
import Reports from "./Reports";
import "./admin.css";

const SERVER_ERROR = "Could not reach the server. Please try again.";


function AdminApp() {
  const navigate = useNavigate();

  const [page, setPage] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [profile, setProfile] = useState(null);
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
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  // Authentication: Admin logout
  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError("");

    try {
      await apiRequest("/api/auth/logout", { method: "POST" });

      navigate("/staff-login", { replace: true });
    } catch (error) {
      console.error("Admin logout error:", error);
      setLogoutError("Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  // Load dashboard data from the backend
  useEffect(() => {
    const controller = new AbortController();
    let loading = false;
    const getJson = (path) => apiRequest(path, { signal: controller.signal });

    async function loadAll() {
      if (loading) return;
      loading = true;
      try {
        const servicesData = await getJson("/api/services");
        const queueEntries = await Promise.all(servicesData.map(async (service) => {
          const data = await getJson(`/api/queues/${service.id}`);
          return [service.id, data.queue];
        }));
        const [employeesData, reportsData, dashData, me] = await Promise.all([
          getJson("/api/employees"), getJson("/api/reports"),
          getJson("/api/dashboard/admin"), getJson("/api/auth/me"),
        ]);
        if (controller.signal.aborted) return;
        setEmployees(employeesData);
        setReports(reportsData);
        setProfile(me.user);
        setActivity(dashData.activity);
        setServices(servicesData);
        setQueues(Object.fromEntries(queueEntries));
      } catch (error) {
        if (error.name !== "AbortError") setLoadError(error.message);
      } finally {
        loading = false;
      }
    }

    loadAll();
    const timer = setInterval(loadAll, 5000);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, []);

  const runAction = (action) => async (...args) => {
    setLoadError("");
    try {
      await action(...args);
    } catch (error) {
      setLoadError(error.message || "Could not reach the server. Please try again.");
    }
  };

  const toggleQueue = runAction(async (serviceId) => {
    const service = services.find((item) => item.id === serviceId);
    if (!service) return;
    const updated = await apiRequest(`/api/services/${serviceId}/status`, {
      method: "PATCH", body: JSON.stringify({ open: !service.open }),
    });
    setServices((current) => current.map((item) => item.id === serviceId ? updated : item));
  });

  const serveNext = runAction(async (serviceId) => {
    const data = await apiRequest(`/api/queues/${serviceId}/serve-next`, { method: "POST" });
    setQueues((current) => ({ ...current, [serviceId]: data.queue }));
  });

  const removeStudent = runAction(async (serviceId, studentId) => {
    const data = await apiRequest(`/api/queues/${serviceId}/users/${studentId}`, { method: "DELETE" });
    setQueues((current) => ({ ...current, [serviceId]: data.queue }));
  });

  const moveStudent = runAction(async (serviceId, index, direction) => {
    const toIndex = direction === "up" ? index - 1 : index + 1;
    if (toIndex < 0 || toIndex >= (queues[serviceId] || []).length) return;
    const data = await apiRequest(`/api/queues/${serviceId}/reorder`, {
      method: "PATCH", body: JSON.stringify({ fromIndex: index, toIndex }),
    });
    setQueues((current) => ({ ...current, [serviceId]: data }));
  });

  const updateStudentStatus = runAction(async (serviceId, studentId, status) => {
    const updated = await apiRequest(`/api/queues/${serviceId}/users/${studentId}/status`, {
      method: "PATCH", body: JSON.stringify({ status }),
    });
    setQueues((current) => ({ ...current,
      [serviceId]: (current[serviceId] || []).map((student) => student.id === studentId ? updated : student),
    }));
  });

  const openQueuePage = (serviceId) => {
    setViewingServiceId(serviceId);
    setPage("queues");
  };

  const addService = async (serviceData) => {
    try {
      const service = await apiRequest("/api/services", { method: "POST", body: JSON.stringify(serviceData) });
      setServices((current) => [...current, service]);
      setQueues((current) => ({ ...current, [service.id]: [] }));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message || SERVER_ERROR };
    }
  };

  const editService = async (serviceId, serviceData) => {
    try {
      const updated = await apiRequest(`/api/services/${serviceId}`, { method: "PUT", body: JSON.stringify(serviceData) });
      setServices((current) => current.map((item) => item.id === serviceId ? updated : item));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message || SERVER_ERROR };
    }
  };

  const addEmployee = async (employeeData) => {
    try {
      const employee = await apiRequest("/api/employees", { method: "POST", body: JSON.stringify(employeeData) });
      setEmployees((current) => [...current, employee]);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message || SERVER_ERROR };
    }
  };

  const updateReportStatus = runAction(async (reportId, status) => {
    const updated = await apiRequest(`/api/reports/${reportId}/status`, {
      method: "PATCH", body: JSON.stringify({ status }),
    });
    setReports((current) => current.map((report) => report.id === reportId ? updated : report));
  });

  // Render the selected admin page
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
        onSignOut={handleLogout}
        loggingOut={loggingOut}
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
            <span>{profile?.firstName?.[0]}{profile?.lastName?.[0]}</span>

            <div>
              <strong>{profile ? `${profile.firstName} ${profile.lastName}` : "Administrator"}</strong>
              <small>Administrator</small>
            </div>

            {/* Admin logout */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                marginLeft: "16px",
                padding: "8px 14px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                backgroundColor: "#fff",
                color: "#333",
                cursor: loggingOut ? "not-allowed" : "pointer",
              }}
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>

            {logoutError && (
              <span role="alert" style={{ color: "#b91c1c" }}>
                {logoutError}
              </span>
            )}
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
