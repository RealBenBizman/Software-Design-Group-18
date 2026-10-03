import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminDashboard from "./AdminDashboard";
import AdminQueueManagement from "./AdminQueueManagement";
import ServiceManagement from "./ServiceManagement";
import EmployeeManagement from "./EmployeeManagement";
import Reports from "./Reports";
import {
  activityData,
  initialAdminQueues,
  initialAdminServices,
  initialEmployees,
  initialReports,
} from "./adminMockData";
import "./admin.css";

function AdminApp() {
  const [page, setPage] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [services, setServices] = useState(initialAdminServices);
  const [queues, setQueues] = useState(initialAdminQueues);
  const [employees, setEmployees] = useState(initialEmployees);
  const [reports, setReports] = useState(initialReports);
  const [viewingServiceId, setViewingServiceId] = useState(1);

  const toggleQueue = (serviceId) => {
    setServices((current) =>
      current.map((service) =>
        service.id === serviceId
          ? { ...service, open: !service.open }
          : service
      )
    );
  };

  const openQueuePage = (serviceId) => {
    setViewingServiceId(serviceId);
    setPage("queues");
  };

  const serveNext = (serviceId) => {
    setQueues((current) => ({
      ...current,
      [serviceId]: current[serviceId].slice(1),
    }));
  };

  const removeStudent = (serviceId, studentId) => {
    setQueues((current) => ({
      ...current,
      [serviceId]: current[serviceId].filter(
        (student) => student.id !== studentId
      ),
    }));
  };

  const moveStudent = (serviceId, index, direction) => {
    setQueues((current) => {
      const updated = [...current[serviceId]];
      const newIndex = direction === "up" ? index - 1 : index + 1;

      if (newIndex < 0 || newIndex >= updated.length) {
        return current;
      }

      const temp = updated[index];
      updated[index] = updated[newIndex];
      updated[newIndex] = temp;

      return {
        ...current,
        [serviceId]: updated,
      };
    });
  };

  const updateStudentStatus = (serviceId, studentId, status) => {
    setQueues((current) => ({
      ...current,
      [serviceId]: current[serviceId].map((student) =>
        student.id === studentId ? { ...student, status } : student
      ),
    }));
  };

  const addService = (serviceData) => {
    const newId =
      services.length > 0
        ? Math.max(...services.map((service) => service.id)) + 1
        : 1;

    const newService = {
      id: newId,
      ...serviceData,
      open: false,
    };

    setServices((current) => [...current, newService]);
    setQueues((current) => ({
      ...current,
      [newId]: [],
    }));
  };

  const editService = (serviceId, serviceData) => {
    setServices((current) =>
      current.map((service) =>
        service.id === serviceId
          ? { ...service, ...serviceData }
          : service
      )
    );
  };

  const addEmployee = (employeeData) => {
    const newId =
      employees.length > 0
        ? Math.max(...employees.map((employee) => employee.id)) + 1
        : 1;

    setEmployees((current) => [
      ...current,
      {
        id: newId,
        ...employeeData,
      },
    ]);
  };

  const updateReportStatus = (reportId, status) => {
    setReports((current) =>
      current.map((report) =>
        report.id === reportId ? { ...report, status } : report
      )
    );
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
          activity={activityData}
          onUpdateReportStatus={updateReportStatus}
        />
      );
    }

    return (
      <AdminDashboard
        services={services}
        queues={queues}
        employees={employees}
        activity={activityData}
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

        <div className="admin-content">{renderPage()}</div>
      </main>
    </div>
  );
}

export default AdminApp;
