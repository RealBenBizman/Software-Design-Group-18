import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import QueueNotifications from "../components/QueueNotifications";
import { studentQueueRequest } from "../utils/studentQueueApi";
import "../styles/Student.css";

function QueueStatus() {
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leaveError, setLeaveError] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    async function loadStatus() {
      if (pending) return;
      pending = true;
      try {
        const data = await studentQueueRequest("/api/queue/status/me", { signal: controller.signal });
        if (!controller.signal.aborted) {
          setQueue(data.inQueue ? data.status : null);
          setError("");
        }
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        pending = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadStatus();
    const timer = setInterval(loadStatus, 5000);
    return () => { clearInterval(timer); controller.abort(); };
  }, [reload]);

  async function leaveQueue() {
    setLeaving(true);
    setLeaveError("");
    try {
      await studentQueueRequest("/api/queue/leave", {
        method: "POST",
        body: JSON.stringify({ serviceID: queue.serviceID })
      });
      setQueue(null);
      setConfirmLeave(false);
      setReload((value) => value + 1);
    } catch (err) {
      setLeaveError(err.message);
      setReload((value) => value + 1);
    } finally {
      setLeaving(false);
    }
  }

  const steps = ["Joined", "Waiting", "Almost Ready", "Next in Line"];
  const currentStep = !queue ? 0 : queue.position === 1 ? 3
    : queue.position <= 2 || queue.queueStatus === "almost ready" ? 2 : 1;

  return (
    <div className="student-page">
      <div className="student-container narrow-container">
        <div className="student-heading">
          <div><h1>Live Queue</h1><p>Track your spot in line. Updates every five seconds.</p></div>
          <Link to="/history">View History</Link>
        </div>
        {loading && <p role="status">Loading queue status...</p>}
        {error && <p className="error-message" role="alert">{error}</p>}
        {!loading && !error && !queue && (
          <section className="student-card" style={{ marginBottom: 24 }}>
            <h2>You are not in a queue</h2>
            <p>Check History for your previous visits, or join a service queue.</p>
            <Link to="/join-queue" className="student-button-link" style={{ display: "inline-block" }}>Join Queue</Link>
          </section>
        )}
        {!loading && !error && queue && (
          <section className="student-card" aria-label="Active queue ticket" style={{ marginBottom: 24, border: "2px solid #0047AB" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div><span>Ticket Number</span><h2 style={{ margin: "8px 0 20px" }}>{queue.queueID}</h2></div>
              <span className="status-label" style={{ alignSelf: "flex-start" }}>{steps[currentStep]}</span>
            </div>
            <ol aria-label="Queue progress" style={{ display: "flex", listStyle: "none", padding: 0, gap: 8, marginBottom: 24 }}>
              {steps.map((step, index) => (
                <li key={step} aria-current={index === currentStep ? "step" : undefined}
                  style={{ flex: 1, textAlign: "center", fontSize: 12, color: "#000080" }}>
                  <span style={{ display: "block", margin: "0 auto 8px", padding: "8px 0", borderRadius: 8,
                    background: index <= currentStep ? "#0047AB" : "#e2e8f0", color: index <= currentStep ? "white" : "#000080" }}>
                    {index + 1}
                  </span>{step}
                </li>
              ))}
            </ol>
            <div className="student-grid" style={{ marginBottom: 24 }}>
              <div><p>Your Position In Line</p><strong style={{ color: "#000080", fontSize: 28 }}>#{queue.position}</strong>
                <p>{queue.aheadPeople} people ahead</p></div>
              <div><p>Estimated Wait</p><strong style={{ color: "#0047AB", fontSize: 28 }}>{queue.estWaitMinutes} minutes</strong>
                <p>Estimates may change.</p></div>
            </div>
            <p><strong>Service:</strong> {queue.serviceName}</p>
            <p><strong>Joined:</strong> {queue.joinedAt ? new Date(queue.joinedAt).toLocaleString() : "Time unavailable"}</p>
            {leaveError && <p className="error-message" role="alert">{leaveError}</p>}
            {confirmLeave ? (
              <div className="confirmation-box" role="group" aria-label="Confirm leaving the queue">
                <h3>Leave this queue?</h3><p>You will lose ticket {queue.queueID} and your place in line.</p>
                <div className="confirmation-buttons" style={{ flexWrap: "wrap" }}>
                  <button type="button" disabled={leaving} onClick={leaveQueue}>{leaving ? "Leaving..." : "Yes, leave queue"}</button>
                  <button type="button" className="secondary-button" disabled={leaving}
                    onClick={() => setConfirmLeave(false)}>Keep my spot</button>
                </div>
              </div>
            ) : <button type="button" className="secondary-button" onClick={() => setConfirmLeave(true)}>Leave Queue</button>}
          </section>
        )}
        <QueueNotifications />
      </div>
    </div>
  );
}

export default QueueStatus;
