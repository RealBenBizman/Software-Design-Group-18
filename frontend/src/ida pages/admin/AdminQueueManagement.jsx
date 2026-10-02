import { useEffect } from "react";

function AdminQueueManagement({
  services,
  queues,
  viewingServiceId,
  setViewingServiceId,
  onToggleQueue,
  onServeNext,
  onRemove,
  onMove,
  onUpdateStatus,
}) {
  useEffect(() => {
    if (!viewingServiceId && services.length > 0) {
      setViewingServiceId(services[0].id);
    }
  }, [viewingServiceId, services, setViewingServiceId]);

  const service = services.find(
    (item) => item.id === Number(viewingServiceId)
  );

  if (!service) {
    return null;
  }

  const queue = queues[service.id] || [];

  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">queue management</p>
          <h2>{service.name}</h2>
          <p>Administrators can view and manage any service queue.</p>
        </div>
      </div>

      <div className="admin-queue-toolbar">
        <label>
          Select service
          <select
            value={service.id}
            onChange={(event) =>
              setViewingServiceId(Number(event.target.value))
            }
          >
            {services.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <div className="admin-queue-summary">
          <span>
            <strong>{queue.length}</strong> waiting
          </span>
          <span>
            <strong>{service.duration} min</strong> expected duration
          </span>
          <span
            className={
              service.open ? "admin-status-open" : "admin-status-closed"
            }
          >
            {service.open ? "open" : "closed"}
          </span>
        </div>
      </div>

      <div className="admin-queue-actions">
        <button
          className="admin-button-primary"
          onClick={() => onServeNext(service.id)}
          disabled={!service.open || queue.length === 0}
        >
          Serve Next User
        </button>

        <button
          className="admin-button-light"
          onClick={() => onToggleQueue(service.id)}
        >
          {service.open ? "Close Queue" : "Open Queue"}
        </button>
      </div>

      <div className="admin-desktop-table">
        <table>
          <thead>
            <tr>
              <th>Position</th>
              <th>Student</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {queue.map((student, index) => (
              <tr key={student.id}>
                <td>#{index + 1}</td>
                <td>{student.name}</td>
                <td>{student.joined}</td>
                <td>
                  <select
                    className="admin-status-select"
                    value={student.status}
                    onChange={(event) =>
                      onUpdateStatus(
                        service.id,
                        student.id,
                        event.target.value
                      )
                    }
                  >
                    <option value="waiting">Waiting</option>
                    <option value="almost ready">Almost Ready</option>
                  </select>
                </td>
                <td>
                  <div className="admin-table-actions">
                    <button
                      onClick={() => onMove(service.id, index, "up")}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => onMove(service.id, index, "down")}
                      disabled={index === queue.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      className="admin-remove-button"
                      onClick={() => onRemove(service.id, student.id)}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {queue.length === 0 && (
              <tr>
                <td colSpan="5" className="admin-empty-table">
                  No users are currently waiting.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-mobile-queue">
        {queue.map((student, index) => (
          <article className="admin-mobile-queue-card" key={student.id}>
            <div className="admin-mobile-card-top">
              <div>
                <span>#{index + 1}</span>
                <h3>{student.name}</h3>
              </div>
              <span className="admin-student-status">{student.status}</span>
            </div>

            <p>Joined: {student.joined}</p>

            <select
              className="admin-status-select"
              value={student.status}
              onChange={(event) =>
                onUpdateStatus(service.id, student.id, event.target.value)
              }
            >
              <option value="waiting">Waiting</option>
              <option value="almost ready">Almost Ready</option>
            </select>

            <div className="admin-mobile-actions">
              <button
                onClick={() => onMove(service.id, index, "up")}
                disabled={index === 0}
              >
                ↑
              </button>
              <button
                onClick={() => onMove(service.id, index, "down")}
                disabled={index === queue.length - 1}
              >
                ↓
              </button>
              <button
                className="admin-remove-button"
                onClick={() => onRemove(service.id, student.id)}
              >
                Remove
              </button>
            </div>
          </article>
        ))}

        {queue.length === 0 && (
          <div className="admin-empty-mobile">No users are waiting.</div>
        )}
      </div>
    </section>
  );
}

export default AdminQueueManagement;
