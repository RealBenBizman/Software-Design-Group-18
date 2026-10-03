import { useEffect, useState } from "react";

function QueueManagement({
  services,
  queues,
  selectedServiceId,
  viewingServiceId,
  setViewingServiceId,
  onServeNext,
  onRemove,
  onMove,
  onUpdateStatus,
  onToggleQueue,
}) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!viewingServiceId && selectedServiceId) {
      setViewingServiceId(selectedServiceId);
    }
  }, [viewingServiceId, selectedServiceId, setViewingServiceId]);

  const service = services.find(
    (item) => item.id === Number(viewingServiceId)
  );

  if (!service) {
    return null;
  }

  const queue = queues[service.id] || [];
  const canManage = service.id === selectedServiceId;
  const estimatedWait = queue.length * service.minutesPerPerson;

  const serveNext = () => {
    if (!queue.length) {
      setMessage("There is nobody waiting in this queue.");
      return;
    }

    const nextStudent = queue[0];
    onServeNext(service.id);
    setMessage(`${nextStudent.name} is now being served.`);
  };

  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <p className="eyebrow">queue management</p>
          <h2>{service.name}</h2>
          <p>
            {canManage
              ? "You can manage this queue because it is your assigned service."
              : "You can view this queue, but only the assigned employees can change it."}
          </p>
        </div>
      </div>

      <div className="queue-toolbar">
        <label>
          View service
          <select
            value={service.id}
            onChange={(event) => {
              setViewingServiceId(Number(event.target.value));
              setMessage("");
            }}
          >
            {services.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <div className="queue-toolbar-info">
          <span>
            <strong>{queue.length}</strong> waiting
          </span>
          <span>
            <strong>{estimatedWait} min</strong> estimated wait
          </span>
          <span className={service.open ? "status-open" : "status-closed"}>
            {service.open ? "open" : "closed"}
          </span>
        </div>
      </div>

      {!canManage && (
        <div className="read-only-message">
          read-only view — your assigned service is different.
        </div>
      )}

      {message && <div className="success-message">{message}</div>}

      <div className="queue-actions">
        {canManage && (
          <>
            <button
              className="button-primary"
              onClick={serveNext}
              disabled={!service.open || queue.length === 0}
            >
              Serve Next Student
            </button>

            <button
              className="button-light"
              onClick={() => onToggleQueue(service.id)}
            >
              {service.open ? "Close Queue" : "Open Queue"}
            </button>
          </>
        )}
      </div>

      <div className="desktop-table-wrap">
        <table className="queue-table">
          <thead>
            <tr>
              <th>Position</th>
              <th>Student</th>
              <th>Joined</th>
              <th>Status</th>
              {canManage && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {queue.map((student, index) => (
              <tr key={student.id}>
                <td>#{index + 1}</td>
                <td>{student.name}</td>
                <td>{student.joined}</td>
                <td>
                  {canManage ? (
                    <select
                      className="status-select"
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
                  ) : (
                    <span className="student-status">{student.status}</span>
                  )}
                </td>

                {canManage && (
                  <td>
                    <div className="table-actions">
                      <button
                        title="move up"
                        onClick={() => onMove(service.id, index, "up")}
                        disabled={index === 0}
                      >
                        ↑
                      </button>

                      <button
                        title="move down"
                        onClick={() => onMove(service.id, index, "down")}
                        disabled={index === queue.length - 1}
                      >
                        ↓
                      </button>

                      <button
                        className="remove-button"
                        onClick={() => onRemove(service.id, student.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}

            {queue.length === 0 && (
              <tr>
                <td colSpan={canManage ? 5 : 4} className="empty-table">
                  No students are currently waiting.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mobile-queue-list">
        {queue.map((student, index) => (
          <article className="mobile-queue-card" key={student.id}>
            <div className="mobile-card-top">
              <div>
                <span className="position-number">#{index + 1}</span>
                <h3>{student.name}</h3>
              </div>

              <span className="student-status">{student.status}</span>
            </div>

            <p>Joined: {student.joined}</p>

            {canManage && (
              <>
                <select
                  className="status-select"
                  value={student.status}
                  onChange={(event) =>
                    onUpdateStatus(service.id, student.id, event.target.value)
                  }
                >
                  <option value="waiting">Waiting</option>
                  <option value="almost ready">Almost Ready</option>
                </select>

                <div className="mobile-card-actions">
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
                    className="remove-button"
                    onClick={() => onRemove(service.id, student.id)}
                  >
                    Remove
                  </button>
                </div>
              </>
            )}
          </article>
        ))}

        {queue.length === 0 && (
          <div className="empty-mobile-card">
            No students are currently waiting.
          </div>
        )}
      </div>
    </section>
  );
}

export default QueueManagement;
