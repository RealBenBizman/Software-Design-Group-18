
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import EmployeeSidebar from "./EmployeeSidebar";
import EmployeeDashboard from "./EmployeeDashboard";
import ServiceSelection from "./ServiceSelection";
import QueueManagement from "./QueueManagement";
import Appointments from "./Appointments";
import "./employee.css";

const API = "http://localhost:3001";

// Temporary employee ID until employee records are linked to auth
const EMPLOYEE_ID = 1;

function EmployeeApp() {
  const navigate = useNavigate();

  const [page, setPage] = useState("services");
  const [menuOpen, setMenuOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [queues, setQueues] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [viewingServiceId, setViewingServiceId] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
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

        setAppointments(await getJson("/api/appointments"));

        const dashData = await getJson(
          `/api/dashboard/employee/${EMPLOYEE_ID}`
        );

        const assignedServiceId = dashData.employee.serviceId;

        if (assignedServiceId) {
          setSelectedServiceId(assignedServiceId);
          setViewingServiceId(assignedServiceId);
          setPage("dashboard");
        }
      } catch (error) {
        console.error("Failed to load employee data:", error);
        setLoadError("Could not reach the server. Please try again.");
      }
    }

    loadAll();
  }, []);

  // End the employee's authentication session
  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError("");

    try {
      const response = await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      navigate("/staff-login", { replace: true });
    } catch (error) {
      console.error("Employee logout error:", error);
      setLogoutError("Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  const selectedService = services.find(
    (service) => service.id === selectedServiceId
  );

  const chooseService = async (serviceId) => {
    const res = await fetch(`${API}/api/employees/${EMPLOYEE_ID}/service`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId }),
    });

    if (res.ok) {
      setSelectedServiceId(serviceId);
      setViewingServiceId(serviceId);
      setPage("dashboard");
    }
  };

  const toggleQueue = async (serviceId) => {
    if (serviceId !== selectedServiceId) return;

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

  const serveNext = async (serviceId) => {
    if (serviceId !== selectedServiceId) return;

    const res = await fetch(`${API}/api/queues/${serviceId}/serve-next`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "employee",
        employeeId: EMPLOYEE_ID,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setQueues((current) => ({
        ...current,
        [serviceId]: data.queue,
      }));
    }
  };

  const removeStudent = async (serviceId, studentId) => {
    if (serviceId !== selectedServiceId) return;

    const res = await fetch(
      `${API}/api/queues/${serviceId}/users/${studentId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "employee",
          employeeId: EMPLOYEE_ID,
        }),
      }
    );

    const data = await res.json();

    if (res.ok) {
      setQueues((current) => ({
        ...current,
        [serviceId]: data.queue,
      }));
    }
  };

  const moveStudent = async (serviceId, index, direction) => {
    if (serviceId !== selectedServiceId) return;

    const queue = queues[serviceId] || [];
    const toIndex = direction === "up" ? index - 1 : index + 1;

    if (toIndex < 0 || toIndex >= queue.length) return;

    const res = await fetch(`${API}/api/queues/${serviceId}/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "employee",
        employeeId: EMPLOYEE_ID,
        fromIndex: index,
        toIndex,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setQueues((current) => ({
        ...current,
        [serviceId]: data,
      }));
    }
  };

  const updateStudentStatus = async (serviceId, studentId, newStatus) => {
    if (serviceId !== selectedServiceId) return;

    const res = await fetch(
      `${API}/api/queues/${serviceId}/users/${studentId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "employee",
          employeeId: EMPLOYEE_ID,
          status: newStatus,
        }),
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

  const updateAppointment = async (appointmentId, newStatus) => {
    const res = await fetch(
      `${API}/api/appointments/${appointmentId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    const updated = await res.json();

    if (res.ok) {
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId ? updated : appointment
        )
      );
    }
  };

  // Preserve the employee clock-out feature
  // and end the authentication session afterward
  const signOut = async () => {
    try {
      await fetch(`${API}/api/employees/${EMPLOYEE_ID}/clock-out`, {
        method: "PATCH",
      });
    } catch (error) {
      console.error("Employee clock-out error:", error);
    }

    await handleLogout();
  };

  const openQueuePage = (serviceId) => {
    setViewingServiceId(serviceId);
    setPage("queue");
  };

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
            <span>JS</span>

            <div>
              <strong>Jordan Smith</strong>
              <small>Employee</small>
            </div>

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
