import { useState } from "react";
import EmployeeSidebar from "./EmployeeSidebar";
import EmployeeDashboard from "./EmployeeDashboard";
import ServiceSelection from "./ServiceSelection";
import QueueManagement from "./QueueManagement";
import Appointments from "./Appointments";
import {
  initialAppointments,
  initialQueues,
  initialServices,
} from "./employeeData";
import "./employee.css";

function EmployeeApp() {
  const [page, setPage] = useState("services");
  const [menuOpen, setMenuOpen] = useState(false);
  const [services, setServices] = useState(initialServices);
  const [queues, setQueues] = useState(initialQueues);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [viewingServiceId, setViewingServiceId] = useState(null);

  const selectedService = services.find(
    (service) => service.id === selectedServiceId
  );

  const chooseService = (serviceId) => {
    setSelectedServiceId(serviceId);
    setViewingServiceId(serviceId);
    setPage("dashboard");
  };

  const toggleQueue = (serviceId) => {
    if (serviceId !== selectedServiceId) {
      return;
    }

    setServices((current) =>
      current.map((service) =>
        service.id === serviceId
          ? { ...service, open: !service.open }
          : service
      )
    );
  };

  const serveNext = (serviceId) => {
    if (serviceId !== selectedServiceId) {
      return;
    }

    setQueues((current) => ({
      ...current,
      [serviceId]: current[serviceId].slice(1),
    }));
  };

  const removeStudent = (serviceId, studentId) => {
    if (serviceId !== selectedServiceId) {
      return;
    }

    setQueues((current) => ({
      ...current,
      [serviceId]: current[serviceId].filter(
        (student) => student.id !== studentId
      ),
    }));
  };

  const moveStudent = (serviceId, index, direction) => {
    if (serviceId !== selectedServiceId) {
      return;
    }

    setQueues((current) => {
      const updatedQueue = [...current[serviceId]];
      const newIndex = direction === "up" ? index - 1 : index + 1;

      if (newIndex < 0 || newIndex >= updatedQueue.length) {
        return current;
      }

      const temp = updatedQueue[index];
      updatedQueue[index] = updatedQueue[newIndex];
      updatedQueue[newIndex] = temp;

      return {
        ...current,
        [serviceId]: updatedQueue,
      };
    });
  };

  const updateStudentStatus = (serviceId, studentId, newStatus) => {
    if (serviceId !== selectedServiceId) {
      return;
    }

    setQueues((current) => ({
      ...current,
      [serviceId]: current[serviceId].map((student) =>
        student.id === studentId
          ? { ...student, status: newStatus }
          : student
      ),
    }));
  };

  const updateAppointment = (appointmentId, newStatus) => {
    setAppointments((current) =>
      current.map((appointment) => {
        if (
          appointment.id === appointmentId &&
          appointment.serviceId === selectedServiceId
        ) {
          return { ...appointment, status: newStatus };
        }

        return appointment;
      })
    );
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
            <strong>QueueSmart</strong>
          </div>

          <div className="employee-profile">
            <span>JS</span>
            <div>
              <strong>Jordan Smith</strong>
              <small>Employee</small>
            </div>
          </div>
        </header>

        <div className="employee-content">{renderPage()}</div>
      </main>
    </div>
  );
}

export default EmployeeApp;
