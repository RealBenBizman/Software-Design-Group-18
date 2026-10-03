function Reports({ reports, activity, onUpdateReportStatus }) {
  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">reports</p>
          <h2>Reports & Activity</h2>
          <p>Review user reports and basic QueueSmart activity data.</p>
        </div>
      </div>

      <div className="admin-stats-grid admin-report-stats">
        <article className="admin-stat-card">
          <span>students served</span>
          <strong>{activity.studentsServed}</strong>
        </article>
        <article className="admin-stat-card">
          <span>appointments completed</span>
          <strong>{activity.appointmentsCompleted}</strong>
        </article>
        <article className="admin-stat-card">
          <span>average wait</span>
          <strong>{activity.averageWait} min</strong>
        </article>
        <article className="admin-stat-card">
          <span>no shows</span>
          <strong>{activity.noShows}</strong>
        </article>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-card-label">user reports</p>
            <h3>Submitted Reports</h3>
          </div>
        </div>

        <div className="admin-desktop-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Category</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.date}</td>
                  <td>{report.user}</td>
                  <td>{report.category}</td>
                  <td>{report.description}</td>
                  <td>
                    <select
                      className="admin-status-select"
                      value={report.status}
                      onChange={(event) =>
                        onUpdateReportStatus(report.id, event.target.value)
                      }
                    >
                      <option value="open">Open</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-mobile-report-list">
          {reports.map((report) => (
            <article className="admin-mobile-report-card" key={report.id}>
              <div className="admin-mobile-report-top">
                <strong>Report #{report.id}</strong>
                <span>{report.date}</span>
              </div>

              <h3>{report.category}</h3>
              <p>{report.description}</p>
              <small>Submitted by {report.user}</small>

              <select
                className="admin-status-select"
                value={report.status}
                onChange={(event) =>
                  onUpdateReportStatus(report.id, event.target.value)
                }
              >
                <option value="open">Open</option>
                <option value="reviewing">Reviewing</option>
                <option value="resolved">Resolved</option>
              </select>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Reports;
