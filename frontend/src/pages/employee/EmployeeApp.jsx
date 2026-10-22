import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeSidebar from "./EmployeeSidebar";
import EmployeeDashboard from "./EmployeeDashboard";
import ServiceSelection from "./ServiceSelection";
import QueueManagement from "./QueueManagement";
import Appointments from "./Appointments";
import "./employee.css";

const API = "http://localhost:3000";
// Temporary employee ID — replace with auth context when authentication is integrated
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

        setAppointments(await getJson("/api/appointments"));

        // skip the service picker if the employee is already assigned
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
        console.error("failed to load employee data:", error);
        setLoadError("Could not reach the server. Please try again.");
      }
    }

    loadAll();
  }, []);

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
    if (serviceId !== selectedServiceId) {
      return;
    }

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
    if (serviceId !== selectedServiceId) {
      return;
    }

    const res = await fetch(`${API}/api/queues/${serviceId}/serve-next`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "employee", employeeId: EMPLOYEE_ID }),
    });
    const data = await res.json();
    if (res.ok) {
      setQueues((current) => ({ ...current, [serviceId]: data.queue }));
    }
  };

  const removeStudent = async (serviceId, studentId) => {
    if (serviceId !== selectedServiceId) {
      return;
    }

    const res = await fetch(
      `${API}/api/queues/${serviceId}/users/${studentId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "employee", employeeId: EMPLOYEE_ID }),
      }
    );
    const data = await res.json();
    if (res.ok) {
      setQueues((current) => ({ ...current, [serviceId]: data.queue }));
    }
  };

  const moveStudent = async (serviceId, index, direction) => {
    if (serviceId !== selectedServiceId) {
      return;
    }

    const queue = queues[serviceId] || [];
    const toIndex = direction === "up" ? index - 1 : index + 1;

    if (toIndex < 0 || toIndex >= queue.length) {
      return;
    }

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
      setQueues((current) => ({ ...current, [serviceId]: data }));
    }
  };

  const updateStudentStatus = async (serviceId, studentId, newStatus) => {
    if (serviceId !== selectedServiceId) {
      return;
    }

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
    const res = await fetch(`${API}/api/appointments/${appointmentId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const updated = await res.json();
    if (res.ok) {
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId ? updated : appointment
        )
      );
    }
  };

  const signOut = async () => {
    try {
      await fetch(`${API}/api/employees/${EMPLOYEE_ID}/clock-out`, {
        method: "PATCH",
      });
    } catch {
      // still sign out if the server can't be reached
    }
    navigate("/login");
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
