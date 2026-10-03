import { useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/Student.css";

const services = [
  "FAFSA & Application Help",
  "Scholarships & Grants",
  "Loans & Counseling",
  "Awards & Disbursement",
];

const times = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM"];

function getTomorrow() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function Appointments() {
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [pendingAppointment, setPendingAppointment] = useState(null);
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      service: "FAFSA & Application Help",
      date: getTomorrow(),
      time: "10:00 AM",
    },
  ]);

  function handleSubmit(event) {
    event.preventDefault();

    setPendingAppointment({ service, date, time });
    setMessage("");
  }

  function confirmAppointment() {
    setAppointments([
      ...appointments,
      { ...pendingAppointment, id: Date.now() },
    ]);
    setPendingAppointment(null);
    setMessage("Appointment booked successfully.");
    setService("");
    setDate("");
    setTime("");
  }

  function cancelAppointment(id) {
    setAppointments(appointments.filter((appointment) => appointment.id !== id));
    setMessage("Appointment cancelled.");
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
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>

              <label htmlFor="appointment-date">Date</label>
              <input
                id="appointment-date"
                type="date"
                min={getTomorrow()}
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

              <button type="submit">Book Appointment</button>
            </form>

            {pendingAppointment && (
              <div className="confirmation-box">
                <h3>Confirm Appointment</h3>
                <p><strong>Service:</strong> {pendingAppointment.service}</p>
                <p><strong>Date:</strong> {pendingAppointment.date}</p>
                <p><strong>Time:</strong> {pendingAppointment.time}</p>
                <div className="confirmation-buttons">
                  <button type="button" onClick={confirmAppointment}>Confirm</button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setPendingAppointment(null)}
                  >
                    Go Back
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="student-card">
            <h2>Upcoming Appointments</h2>

            {appointments.length === 0 ? (
              <p>No upcoming appointments.</p>
            ) : (
              appointments.map((appointment) => (
                <div className="appointment-item" key={appointment.id}>
                  <h3>{appointment.service}</h3>
                  <p>{appointment.date} at {appointment.time}</p>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => cancelAppointment(appointment.id)}
                  >
                    Cancel Appointment
                  </button>
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
