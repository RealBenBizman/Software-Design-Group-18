function EmployeeDashboard({
  services,
  queues,
  appointments,
  selectedService,
  onManageQueue,
  onViewQueue,
  onViewAppointments,
  onChangeService,
  onToggleQueue,
}) {
  if (!selectedService) {
    return null;
  }

  const myQueue = queues[selectedService.id] || [];
  const myAppointments = appointments.filter(
    (appointment) =>
      appointment.serviceId === selectedService.id &&
      appointment.date === "Today" &&
      appointment.status !== "completed" &&
      appointment.status !== "no show"
  );

  const estimatedWait = myQueue.length * selectedService.minutesPerPerson;

  const nextAppointment = myAppointments[0];

  return (
    <section className="page-section">
      <div className="page-heading dashboard-heading">
        <div>
          <p className="eyebrow">employee dashboard</p>
          <h2>Good morning, Jordan</h2>
          <p>Here is what is happening with the financial aid office today.</p>
        </div>

        <button className="button-light" onClick={onChangeService}>
          Change Service
        </button>
      </div>

      <div className="current-service-card">
        <div>
          <p className="card-label">your service today</p>
          <h3>{selectedService.name}</h3>
          <div className="service-status-row">
            <span
              className={
                selectedService.open ? "status-open" : "status-closed"
              }
            >
              {selectedService.open ? "open" : "closed"}
            </span>
          </div>
        </div>

        <div className="current-service-actions">
          <button className="button-primary" onClick={onManageQueue}>
            Manage Queue
          </button>

          <button className="button-secondary" onClick={onViewAppointments}>
            View Appointments
          </button>

          <button
            className="button-light"
            onClick={() => onToggleQueue(selectedService.id)}
          >
            {selectedService.open ? "Close Queue" : "Open Queue"}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span>students waiting</span>
          <strong>{myQueue.length}</strong>
        </article>

        <article className="stat-card">
          <span>appointments today</span>
          <strong>{myAppointments.length}</strong>
        </article>

        <article className="stat-card">
          <span>estimated wait</span>
          <strong>{estimatedWait} min</strong>
        </article>
      </div>

      <div className="dashboard-grid-two">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="card-label">next appointment</p>
              <h3>Today</h3>
            </div>

            <button className="text-button" onClick={onViewAppointments}>
              View all
            </button>
          </div>

          {nextAppointment ? (
            <div className="next-appointment">
              <div>
                <strong>{nextAppointment.time}</strong>
                <p>{nextAppointment.name}</p>
                <span>{selectedService.name}</span>
              </div>

              <span className="appointment-status">
                {nextAppointment.status}
              </span>
            </div>
          ) : (
            <p className="empty-text">No more appointments today.</p>
          )}
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="card-label">quick reminder</p>
              <h3>Queue updates</h3>
            </div>
          </div>

          <p className="reminder-text">
            Keep the queue updated when a student is almost ready, removed, or
            finished being served.
          </p>
        </article>
      </div>

      <div className="panel all-services-panel">
        <div className="panel-heading">
          <div>
            <p className="card-label">all service queues</p>
            <h3>Office queue status</h3>
          </div>
        </div>

        <div className="service-list">
          {services.map((service) => {
            const queue = queues[service.id] || [];
            const isMine = service.id === selectedService.id;

            return (
              <div className="service-row" key={service.id}>
                <div className="service-row-main">
                  <div>
                    <h4>{service.name}</h4>
                    <p>
                      {queue.length} waiting · about{" "}
                      {queue.length * service.minutesPerPerson} min
                    </p>
                  </div>

                  <div className="service-badges">
                    {isMine && <span className="mine-badge">your service</span>}
                    <span
                      className={service.open ? "status-open" : "status-closed"}
                    >
                      {service.open ? "open" : "closed"}
                    </span>
                  </div>
                </div>

                <button
                  className={isMine ? "button-primary" : "button-light"}
                  onClick={() => onViewQueue(service.id)}
                >
                  {isMine ? "Manage Queue" : "View Queue"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default EmployeeDashboard;