import { useEffect, useState } from "react";
import "../../styles/Student.css";
import { apiRequest } from "../../utils/api";

function Settings() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest("/api/auth/me", { signal: controller.signal }).then(({ user }) => {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
      setPhone(user.phone || "");
    }).catch((err) => {
      if (err.name !== "AbortError") setError(err.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await apiRequest("/api/account/profile", {
        method: "PATCH", body: JSON.stringify({ firstName, lastName, email, phone }),
      });
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
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
                  maxLength={50}
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
                  maxLength={50}
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
              maxLength={254}
              id="settings-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="settings-phone">Phone Number</label>
            <input
              maxLength={20}
              id="settings-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />

            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}

            <button type="submit" disabled={loading || saving}>{loading ? "Loading..." : saving ? "Saving..." : "Save Changes"}</button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default Settings;
