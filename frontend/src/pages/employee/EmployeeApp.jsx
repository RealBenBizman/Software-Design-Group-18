
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../utils/api";

import EmployeeSidebar from "./EmployeeSidebar";
import EmployeeDashboard from "./EmployeeDashboard";
import ServiceSelection from "./ServiceSelection";
import QueueManagement from "./QueueManagement";
import Appointments from "./Appointments";
import "./employee.css";



function EmployeeApp() {
  const navigate = useNavigate();

  const [page, setPage] = useState("services");
  const [menuOpen, setMenuOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [profile, setProfile] = useState(null);
  const [queues, setQueues] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [viewingServiceId, setViewingServiceId] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let loading = false;
    let initialLoad = true;
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
        const [appointmentsData, dashData] = await Promise.all([
          getJson("/api/appointments"), getJson("/api/dashboard/employee/me"),
        ]);
        if (controller.signal.aborted) return;
        setAppointments(appointmentsData);
        setProfile(dashData.employee);
        setSelectedServiceId(dashData.employee.serviceId);
        if (initialLoad) {
          setViewingServiceId(dashData.employee.serviceId);
          setPage(dashData.employee.serviceId ? "dashboard" : "services");
          initialLoad = false;
        }
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

  // End the employee's authentication session
  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError("");

    try {
      await apiRequest("/api/auth/logout", { method: "POST" });

      navigate("/staff-login", { replace: true });
    } catch (error) {
      console.error("Employee logout error:", error);
      setLogoutError("Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  const selectedService = services.find((service) => service.id === selectedServiceId);

  const runAction = (action) => async (...args) => {
    setLoadError("");
    try {
      return await action(...args);
    } catch (error) {
      setLoadError(error.message || "Could not reach the server. Please try again.");
      return null;
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
    return data;
  });

  const removeStudent = runAction(async (serviceId, studentId) => {
    const data = await apiRequest(`/api/queues/${serviceId}/users/${studentId}`, { method: "DELETE" });
    setQueues((current) => ({ ...current, [serviceId]: data.queue }));
    return data;
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
    setPage("queue");
  };

  const chooseService = runAction(async (serviceId) => {
    const employee = await apiRequest("/api/employees/me/service", {
      method: "PATCH", body: JSON.stringify({ serviceId }),
    });
    setProfile(employee);
    setSelectedServiceId(employee.serviceId);
    setViewingServiceId(employee.serviceId);
    setPage("dashboard");
  });

  const updateAppointment = runAction(async (appointmentId, status) => {
    const updated = await apiRequest(`/api/appointments/${appointmentId}/status`, {
      method: "PATCH", body: JSON.stringify({ status }),
    });
    setAppointments((current) => current.map((item) => item.id === appointmentId ? updated : item));
  });

  const signOut = runAction(async () => {
    if (loggingOut) return;
    await apiRequest("/api/employees/me/clock-out", { method: "PATCH" });
    await handleLogout();
  });

  const renderPage = () => {
    if (!selectedServiceId || page === "services") {
      return (
        <ServiceSelection
          services={services}
          selectedServiceId={selectedServiceId}
          onSave={chooseService}
          onCancel={() => setPage("dashboard")}
        />
      );
    }

    if (page === "queue") {
      return (
        <QueueManagement
          services={services}
          queues={queues}
          selectedServiceId={selectedServiceId}
          viewingServiceId={viewingServiceId}
          setViewingServiceId={setViewingServiceId}
          onServeNext={serveNext}
          onRemove={removeStudent}
          onMove={moveStudent}
          onUpdateStatus={updateStudentStatus}
          onToggleQueue={toggleQueue}
        />
      );
    }

    if (page === "appointments") {
      return (
        <Appointments
          appointments={appointments}
          services={services}
          selectedServiceId={selectedServiceId}
          onUpdateAppointment={updateAppointment}
        />
      );
    }

    return (
      <EmployeeDashboard
        employeeName={profile?.firstName}
        services={services}
        queues={queues}
        appointments={appointments}
        selectedService={selectedService}
        onManageQueue={() => openQueuePage(selectedServiceId)}
        onViewQueue={openQueuePage}
        onViewAppointments={() => setPage("appointments")}
        onChangeService={() => setPage("services")}
        onToggleQueue={toggleQueue}
      />
    );
  };

  return (
    <div className="employee-app">
      <EmployeeSidebar
        page={page}
        setPage={setPage}
        selectedService={selectedService}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onSignOut={signOut}
      />

      <main className="employee-main">
        <header className="employee-topbar">
          <button
            className="mobile-menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="open menu"
          >
            ☰
          </button>

          <div>
            <span className="topbar-role">employee portal</span>
            <strong>NEBB Queue</strong>
          </div>

          <div className="employee-profile">
            <span>{profile?.firstName?.[0]}{profile?.lastName?.[0]}</span>

            <div>
              <strong>{profile ? `${profile.firstName} ${profile.lastName}` : "Employee"}</strong>
              <small>Employee</small>
            </div>

            <button
              type="button"
              onClick={signOut}
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

        <div className="employee-content">
          {loadError && (
            <div className="error-message load-error">
              <span>{loadError}</span>

              <button
                className="button-light"
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

export default EmployeeApp;
