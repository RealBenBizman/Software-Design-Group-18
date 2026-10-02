import { useState } from "react";

function Appointments({
  appointments,
  services,
  selectedServiceId,
  onUpdateAppointment,
}) {
  const [filter, setFilter] = useState("mine");

  const visibleAppointments = appointments.filter((appointment) => {
    if (filter === "all") {
      return true;
    }

    if (filter === "mine") {
      return appointment.serviceId === selectedServiceId;
    }

    return appointment.serviceId === Number(filter);
  });

  const getServiceName = (serviceId) => {
    return services.find((service) => service.id === serviceId)?.name || "";
  };

  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <p className="eyebrow">appointments</p>
          <h2>Today's Appointments</h2>
          <p>
            You can update appointments for your assigned service and view the
            others.
          </p>
        </div>
      </div>

      <div className="appointment-filter">
        <label>
          Show appointments
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="mine">My Service</option>
            <option value="all">All Services</option>
            {services.map((service) => (
              <option value={service.id} key={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="appointment-list">
        {visibleAppointments.map((appointment) => {
          const canManage = appointment.serviceId === selectedServiceId;

          return (
            <article className="appointment-card" key={appointment.id}>
              <div className="appointment-time">
                <strong>{appointment.time}</strong>
                <span>{appointment.date}</span>
              </div>

              <div className="appointment-info">
                <h3>{appointment.name}</h3>
                <p>{getServiceName(appointment.serviceId)}</p>
                {!canManage && <span className="read-only-small">read only</span>}
              </div>

              <div className="appointment-right">
                <span className="appointment-status">{appointment.status}</span>

                {canManage && (
                  <div className="appointment-actions">
                    {appointment.status === "upcoming" && (
                      <button
                        className="button-secondary small-button"
                        onClick={() =>
                          onUpdateAppointment(appointment.id, "checked in")
                        }
                      >
                        Check In
                      </button>
                    )}

                    {appointment.status === "checked in" && (
                      <button
                        className="button-primary small-button"
                        onClick={() =>
                          onUpdateAppointment(appointment.id, "completed")
                        }
                      >
                        Complete
                      </button>
                    )}

                    {appointment.status !== "completed" &&
                      appointment.status !== "no show" && (
                        <button
                          className="button-light small-button"
                          onClick={() =>
                            onUpdateAppointment(appointment.id, "no show")
                          }
                        >
                          No Show
                        </button>
                      )}
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {visibleAppointments.length === 0 && (
          <div className="empty-mobile-card">
            No appointments were found for this service.
          </div>
        )}
      </div>
    </section>
  );
}

export default Appointments;
