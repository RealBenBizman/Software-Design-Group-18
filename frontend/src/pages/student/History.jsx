import { useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/Student.css";

// Dummy data
const historyData = [
  { id: 1, date: "September 18, 2026", service: "Financial Aid Counseling", type: "Queue", outcome: "Served" },
  { id: 2, date: "September 12, 2026", service: "FAFSA & Application Help", type: "Queue", outcome: "Left Queue" },
  { id: 3, date: "September 3, 2026", service: "Scholarships & Grants", type: "Appointment", outcome: "Served" },
  { id: 4, date: "August 28, 2026", service: "Awards & Disbursement", type: "Appointment", outcome: "Cancelled" },
];

function History() {
  const [filter, setFilter] = useState("All");

  const filteredHistory = filter === "All"
    ? historyData
    : historyData.filter((item) => item.type === filter);

  return (
    <div className="student-page">
      <div className="student-container">
        <div className="student-heading">
          <div>
            <h1>History</h1>
            <p>View your past queues and appointments.</p>
          </div>
          <Link to="/appointments">Book Appointment</Link>
        </div>

        <section className="student-card">
          <div className="filter-row">
            <label htmlFor="history-filter">Show</label>
            <select
              id="history-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="All">All Activity</option>
              <option value="Queue">Queues</option>
              <option value="Appointment">Appointments</option>
            </select>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Service</th>
                  <th>Type</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>{item.service}</td>
                    <td>{item.type}</td>
                    <td><span className="status-label">{item.outcome}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default History;
