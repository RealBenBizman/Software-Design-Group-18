import { useEffect, useState } from "react";

function QueueNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;

    async function loadNotifications() {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch("http://localhost:3001/api/notifications", {
          credentials: "include",
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error(response.status === 401
            ? "Please log in again to view your notifications."
            : "Unable to load notifications. Please try again.");
        }
        const data = await response.json();
        if (!controller.signal.aborted) {
          setNotifications(data);
          setError("");
        }
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        pending = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadNotifications();
    const timer = setInterval(loadNotifications, 5000);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [reload]);

  async function markRead(id) {
    setSavingId(id);
    try {
      const response = await fetch(`http://localhost:3001/api/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include"
      });
      if (!response.ok) throw new Error("Unable to mark this notification as read.");
      const updated = await response.json();
      setNotifications((current) => current.map((item) => item.id === id ? updated : item));
      setReload((value) => value + 1);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="student-card" aria-label="Queue notifications">
      <h2>Queue Notifications</h2>
      {loading && <p role="status">Loading notifications...</p>}
      {error && <p className="error-message" role="alert">{error}</p>}
      {!loading && !error && notifications.length === 0 && <p>No notifications yet.</p>}
      {!error && notifications.map((item) => (
        <article className="appointment-item" key={item.id}>
          <p><strong>{item.message}</strong></p>
          <p><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time></p>
          {item.read ? <span className="status-label">Read</span> : (
            <button type="button" onClick={() => markRead(item.id)} disabled={savingId !== null}>
              {savingId === item.id ? "Saving..." : "Mark as read"}
            </button>
          )}
        </article>
      ))}
      <button type="button" className="secondary-button" disabled={loading}
        onClick={() => setReload((value) => value + 1)}>Refresh</button>
    </section>
  );
}

export default QueueNotifications;
