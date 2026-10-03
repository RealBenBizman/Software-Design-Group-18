import { useState } from "react";

function ServiceSelection({ services, selectedServiceId, onSave, onCancel }) {
  const [choice, setChoice] = useState(selectedServiceId || "");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!choice) {
      return;
    }

    onSave(Number(choice));
  };

  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <p className="eyebrow">employee setup</p>
          <h2>Choose your service for today</h2>
          <p>
            You can only work on one service at a time. You will still be able
            to view the other service queues.
          </p>
        </div>
      </div>

      <form className="service-choice-form" onSubmit={handleSubmit}>
        <div className="service-choice-grid">
          {services.map((service) => (
            <label
              key={service.id}
              className={`service-choice-card ${
                Number(choice) === service.id ? "service-choice-selected" : ""
              }`}
            >
              <input
                type="radio"
                name="service"
                value={service.id}
                checked={Number(choice) === service.id}
                onChange={(event) => setChoice(event.target.value)}
              />

              <div>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <span className={service.open ? "status-open" : "status-closed"}>
                  {service.open ? "open" : "closed"}
                </span>
              </div>
            </label>
          ))}
        </div>

        <div className="form-actions">
          {selectedServiceId && (
            <button type="button" className="button-light" onClick={onCancel}>
              Cancel
            </button>
          )}

          <button type="submit" className="button-primary" disabled={!choice}>
            {selectedServiceId ? "Change Service" : "Start Working"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default ServiceSelection;
