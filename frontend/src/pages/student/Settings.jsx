import { useState } from "react";
import "../../styles/Student.css";

function Settings() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const phoneDigits = phone.replace(/\D/g, "");

    if (phoneDigits.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      setMessage("");
      return;
    }

    setError("");
    setMessage("Profile updated successfully.");
  }

  return (
    <div className="student-page">
      <div className="student-container narrow-container">
        <div className="student-heading">
          <div>
            <h1>Settings</h1>
            <p>Update your profile and contact information.</p>
          </div>
        </div>

        <section className="student-card">
          <h2>Profile Information</h2>

          <form onSubmit={handleSubmit}>
            <div className="two-column-form">
              <div>
                <label htmlFor="first-name">First Name</label>
                <input
                  id="first-name"
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="last-name">Last Name</label>
                <input
                  id="last-name"
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                />
              </div>
            </div>

            <label htmlFor="settings-email">Email</label>
            <input
              id="settings-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="settings-phone">Phone Number</label>
            <input
              id="settings-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />

            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}

            <button type="submit">Save Changes</button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Settings;
