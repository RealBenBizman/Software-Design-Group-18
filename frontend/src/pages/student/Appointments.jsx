import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/Student.css";
import { apiRequest } from "../../utils/api";

function Appointments() {
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [pendingAppointment, setPendingAppointment] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [times, setTimes] = useState([]);
  const [minDate, setMinDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    async function load() {
      if (pending) return;
      pending = true;
      try {
        const [options, booked] = await Promise.all([
          apiRequest("/api/account/appointment-options", { signal: controller.signal }),
          apiRequest("/api/account/appointments", { signal: controller.signal }),
        ]);
        if (controller.signal.aborted) return;
        setServices(options.services);
        setTimes(options.times);
        setMinDate(options.minDate);
        setAppointments(booked);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        pending = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    const timer = setInterval(load, 5000);
    return () => { clearInterval(timer); controller.abort(); };
  }, []);

  function handleSubmit(event) {
    event.preventDefault();

    setPendingAppointment({ serviceId: Number(service), date, time });
    setError("");
    setMessage("");
  }

  async function confirmAppointment() {
    setSaving(true);
    setError("");
    try {
      const appointment = await apiRequest("/api/account/appointments", {
        method: "POST", body: JSON.stringify(pendingAppointment),
      });
      setAppointments((current) => [...current, appointment]);
      setPendingAppointment(null);
      setMessage("Appointment booked successfully.");
      setService("");
      setDate("");
      setTime("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function cancelAppointment(id) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await apiRequest(`/api/account/appointments/${id}`, { method: "DELETE" });
      setAppointments((current) => current.filter((appointment) => appointment.id !== id));
      setMessage("Appointment cancelled.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="student-page">
      <div className="student-container">
        <div className="student-heading">
          <div>
            <h1>Appointments</h1>
            <p>Book a future appointment or manage an upcoming appointment.</p>
          </div>
          <Link to="/history">View History</Link>
        </div>

        {loading && <p role="status">Loading appointments...</p>}
        {error && <p className="error-message" role="alert">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <div className="student-grid">
          <section className="student-card">
            <h2>Book an Appointment</h2>

            <form onSubmit={handleSubmit}>
              <label htmlFor="appointment-service">Service</label>
              <select
                id="appointment-service"
                value={service}
                onChange={(event) => setService(event.target.value)}
                required
              >
                <option value="">Select a service</option>
                {services.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>

              <label htmlFor="appointment-date">Date</label>
              <input
                id="appointment-date"
                type="date"
                min={minDate}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
              <small>Same-day appointments are not available.</small>

              <label htmlFor="appointment-time">Time</label>
              <select
                id="appointment-time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                required
              >
                <option value="">Select a time</option>
                {times.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>

              <button type="submit" disabled={loading || saving}>Book Appointment</button>
            </form>

            {pendingAppointment && (
              <div className="confirmation-box">
                <h3>Confirm Appointment</h3>
                <p><strong>Service:</strong> {services.find((item) => item.id === pendingAppointment.serviceId)?.name}</p>
                <p><strong>Date:</strong> {pendingAppointment.date}</p>
                <p><strong>Time:</strong> {pendingAppointment.time}</p>
                <div className="confirmation-buttons">
                  <button type="button" disabled={saving} onClick={confirmAppointment}>{saving ? "Saving..." : "Confirm"}</button>
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={saving}
                    onClick={() => setPendingAppointment(null)}
                  >
                    Go Back
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="student-card">
            <h2>Your Appointments</h2>

            {appointments.length === 0 ? (
              <p>No appointments.</p>
            ) : (
              appointments.map((appointment) => (
                <div className="appointment-item" key={appointment.id}>
                  <h3>{appointment.service}</h3>
                  <p>{appointment.date} at {appointment.time}</p>
                  <p>Status: {appointment.status}</p>
                  {appointment.status === "upcoming" && <button
                    disabled={saving}
                    className="secondary-button"
                    type="button"
                    onClick={() => cancelAppointment(appointment.id)}
                  >
                    Cancel Appointment
                  </button>}
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Appointments;
