import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/Student.css";

const outcomeLabels = {
  waiting: "Waiting",
  served: "Served",
  left: "Left Queue",
  removed: "Removed by Staff"
};

function History() {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadHistory() {
      try {
        const response = await fetch("http://localhost:3001/api/history", {
          credentials: "include",
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error(response.status === 401
            ? "Please log in again to view your history."
            : "Unable to load your history. Please try again.");
        }
        const data = await response.json();
        if (!controller.signal.aborted) {
          setHistory(data);
          setError("");
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadHistory();
    return () => controller.abort();
  }, [reload]);

  const filteredHistory = history.filter((item) =>
    filter === "All" || item.outcome === filter
  );

  return (
    <div className="student-page">
      <div className="student-container">
        <div className="student-heading">
          <div>
            <h1>History</h1>
            <p>View your queue visits and their outcomes.</p>
          </div>
          <Link to="/notifications">View Notifications</Link>
        </div>

        <section className="student-card" aria-label="Queue history">
          <div className="filter-row">
            <label htmlFor="history-filter">Show</label>
            <select id="history-filter" value={filter}
              onChange={(event) => setFilter(event.target.value)}>
              <option value="All">All Outcomes</option>
              {Object.entries(outcomeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button type="button" disabled={loading} onClick={() => {
              setLoading(true);
              setReload((value) => value + 1);
            }}>Refresh</button>
          </div>

          {loading && <p role="status">Loading history...</p>}
          {error && <p className="error-message" role="alert">{error}</p>}
          {!loading && !error && filteredHistory.length === 0 && (
            <p>No queue visits match this filter.</p>
          )}
          {!loading && !error && filteredHistory.length > 0 && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Date</th><th>Service</th><th>Type</th><th>Outcome</th></tr>
                </thead>
                <tbody>
                  {filteredHistory.map((item) => (
                    <tr key={item.id}>
                      <td>{new Date(item.joinedAt || item.endedAt).toLocaleString()}</td>
                      <td>{item.service}</td>
                      <td>{item.type}</td>
                      <td><span className="status-label">{outcomeLabels[item.outcome]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default History;
