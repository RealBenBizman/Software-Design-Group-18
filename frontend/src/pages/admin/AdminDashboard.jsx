function AdminDashboard({
  services,
  queues,
  employees,
  activity,
  onToggleQueue,
  onManageQueue,
  onGoToServices,
  onGoToEmployees,
  onGoToReports,
}) {
  const totalWaiting = services.reduce(
    (total, service) => total + (queues[service.id]?.length || 0),
    0
  );

  const openQueues = services.filter((service) => service.open).length;
  const employeesWorking = employees.filter(
    (employee) => employee.status === "working"
  ).length;

  const getEmployeesForService = (serviceId) => {
    return employees.filter(
      (employee) =>
        employee.serviceId === serviceId && employee.status === "working"
    ).length;
  };

  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">administrator dashboard</p>
          <h2>System Overview</h2>
          <p>View the current status of QueueSmart and manage the office.</p>
        </div>
      </div>

      <div className="admin-stats-grid">
        <article className="admin-stat-card">
          <span>active services</span>
          <strong>{services.length}</strong>
        </article>

        <article className="admin-stat-card">
          <span>open queues</span>
          <strong>{openQueues}</strong>
        </article>

        <article className="admin-stat-card">
          <span>students waiting</span>
          <strong>{totalWaiting}</strong>
        </article>

        <article className="admin-stat-card">
          <span>employees working</span>
          <strong>{employeesWorking}</strong>
        </article>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-card-label">current service queues</p>
            <h3>Today's queue status</h3>
          </div>
        </div>

        <div className="admin-service-list">
          {services.map((service) => {
            const queue = queues[service.id] || [];

            return (
              <div className="admin-service-row" key={service.id}>
                <div className="admin-service-main">
                  <div>
                    <h4>{service.name}</h4>
                    <p>
                      {queue.length} waiting · {getEmployeesForService(service.id)}{" "}
                      employee{getEmployeesForService(service.id) === 1 ? "" : "s"}
                    </p>
                  </div>

                  <span
                    className={
                      service.open ? "admin-status-open" : "admin-status-closed"
                    }
                  >
                    {service.open ? "open" : "closed"}
                  </span>
                </div>

                <div className="admin-row-actions">
                  <button
                    className="admin-button-light"
                    onClick={() => onToggleQueue(service.id)}
                  >
                    {service.open ? "Close Queue" : "Open Queue"}
                  </button>

                  <button
                    className="admin-button-primary"
                    onClick={() => onManageQueue(service.id)}
                  >
                    Manage
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="admin-dashboard-grid">
        <article className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-card-label">today's activity</p>
              <h3>Activity Summary</h3>
            </div>
          </div>

          <div className="admin-activity-list">
            <div>
              <span>students served</span>
              <strong>{activity.studentsServed}</strong>
            </div>
            <div>
              <span>appointments completed</span>
              <strong>{activity.appointmentsCompleted}</strong>
            </div>
            <div>
              <span>average wait</span>
              <strong>{activity.averageWait} min</strong>
            </div>
            <div>
              <span>no shows</span>
              <strong>{activity.noShows}</strong>
            </div>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-card-label">quick actions</p>
              <h3>Manage QueueSmart</h3>
            </div>
          </div>

          <div className="admin-quick-actions">
            <button className="admin-button-secondary" onClick={onGoToServices}>
              Manage Services
            </button>
            <button className="admin-button-secondary" onClick={onGoToEmployees}>
              Add Employee
            </button>
            <button className="admin-button-secondary" onClick={onGoToReports}>
              View Reports
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}

export default AdminDashboard;
