import { useState } from "react";

const emptyEmployee = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

function EmployeeManagement({ employees, services, onAddEmployee }) {
  const [form, setForm] = useState(emptyEmployee);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    onAddEmployee({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: "Employee",
      serviceId: null,
      status: "offline",
    });

    setForm(emptyEmployee);
    setMessage("Employee was added successfully.");
  };

  const getServiceName = (serviceId) => {
    if (!serviceId) {
      return "Not working today";
    }

    return (
      services.find((service) => service.id === serviceId)?.name ||
      "Not working today"
    );
  };

  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">employee management</p>
          <h2>Add Employee</h2>
          <p>Create a new employee account and view current employees.</p>
        </div>
      </div>

      <form className="admin-employee-form" onSubmit={handleSubmit}>
        <div className="admin-form-heading">
          <h3>New Employee</h3>
          <p>The employee can choose their service when they start working.</p>
        </div>

        {error && <div className="admin-form-error">{error}</div>}
        {message && <div className="admin-form-success">{message}</div>}

        <div className="admin-form-grid">
          <label>
            First Name *
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Last Name *
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Employee Email *
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Phone Number *
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Password *
            <input
              type="password"
              name="password"
              minLength="6"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Confirm Password *
            <input
              type="password"
              name="confirmPassword"
              minLength="6"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="admin-button-primary">
            Create Employee
          </button>
        </div>
      </form>

      <div className="admin-panel admin-employee-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-card-label">employees</p>
            <h3>Current Employees</h3>
          </div>
        </div>

        <div className="admin-employee-list">
          {employees.map((employee) => (
            <div className="admin-employee-row" key={employee.id}>
              <div>
                <h4>
                  {employee.firstName} {employee.lastName}
                </h4>
                <p>{employee.email}</p>
              </div>

              <div className="admin-employee-details">
                <span>{getServiceName(employee.serviceId)}</span>
                <span
                  className={
                    employee.status === "working"
                      ? "admin-status-open"
                      : "admin-status-closed"
                  }
                >
                  {employee.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default EmployeeManagement;
