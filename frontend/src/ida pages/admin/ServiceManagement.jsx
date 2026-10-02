import { useEffect, useState } from "react";

const emptyForm = {
  name: "",
  description: "",
  duration: "",
  priority: "",
};

function ServiceManagement({ services, onAddService, onEditService }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!showForm) {
      setError("");
    }
  }, [showForm]);

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = (service) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description,
      duration: service.duration,
      priority: service.priority,
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.description.trim() ||
      !form.duration ||
      !form.priority
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.name.trim().length > 100) {
      setError("Service name cannot be longer than 100 characters.");
      return;
    }

    if (Number(form.duration) < 1) {
      setError("Expected duration must be at least 1 minute.");
      return;
    }

    const serviceData = {
      name: form.name.trim(),
      description: form.description.trim(),
      duration: Number(form.duration),
      priority: form.priority,
    };

    if (editingId) {
      onEditService(editingId, serviceData);
    } else {
      onAddService(serviceData);
    }

    cancelForm();
  };

  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">service management</p>
          <h2>Services</h2>
          <p>Create services or update existing service information.</p>
        </div>

        <button className="admin-button-primary" onClick={startAdd}>
          + Add Service
        </button>
      </div>

      {showForm && (
        <form className="admin-service-form" onSubmit={handleSubmit}>
          <div className="admin-form-heading">
            <h3>{editingId ? "Edit Service" : "Create Service"}</h3>
            <p>Fields marked with * are required.</p>
          </div>

          {error && <div className="admin-form-error">{error}</div>}

          <div className="admin-form-grid">
            <label className="admin-full-field">
              Service Name *
              <input
                type="text"
                name="name"
                maxLength="100"
                value={form.name}
                onChange={handleChange}
                required
              />
              <small>{form.name.length}/100 characters</small>
            </label>

            <label className="admin-full-field">
              Description *
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="4"
                required
              />
            </label>

            <label>
              Expected Duration *
              <input
                type="number"
                name="duration"
                min="1"
                value={form.duration}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Priority Level *
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                required
              >
                <option value="">Select priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>

          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-button-light"
              onClick={cancelForm}
            >
              Cancel
            </button>
            <button type="submit" className="admin-button-primary">
              {editingId ? "Save Changes" : "Create Service"}
            </button>
          </div>
        </form>
      )}

      <div className="admin-service-cards">
        {services.map((service) => (
          <article className="admin-service-card" key={service.id}>
            <div className="admin-service-card-top">
              <div>
                <h3>{service.name}</h3>
                <span
                  className={
                    service.open ? "admin-status-open" : "admin-status-closed"
                  }
                >
                  {service.open ? "open" : "closed"}
                </span>
              </div>

              <button
                className="admin-button-light"
                onClick={() => startEdit(service)}
              >
                Edit
              </button>
            </div>

            <p>{service.description}</p>

            <div className="admin-service-card-info">
              <span>
                Duration: <strong>{service.duration} min</strong>
              </span>
              <span>
                Priority: <strong>{service.priority}</strong>
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ServiceManagement;
