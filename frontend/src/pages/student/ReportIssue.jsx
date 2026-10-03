import { useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/Student.css";

function ReportIssue() {
  const [issueType, setIssueType] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    setMessage("Your report has been submitted.");
    setIssueType("");
    setSubject("");
    setDescription("");
  }

  return (
    <div className="student-page">
      <div className="student-container narrow-container">
        <div className="student-heading">
          <div>
            <h1>Report an Issue</h1>
            <p>Report a system, employee, or service issue.</p>
          </div>
          <Link to="/help">Back to Help</Link>
        </div>

        <section className="student-card">
          <form onSubmit={handleSubmit}>
            <label htmlFor="issue-type">Issue Type</label>
            <select
              id="issue-type"
              value={issueType}
              onChange={(event) => setIssueType(event.target.value)}
              required
            >
              <option value="">Select an issue type</option>
              <option value="system">System Issue</option>
              <option value="employee">Employee Issue</option>
              <option value="service">Service Issue</option>
            </select>

            <label htmlFor="issue-subject">Subject</label>
            <input
              id="issue-subject"
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength="100"
              required
            />

            <label htmlFor="issue-description">Description</label>
            <textarea
              id="issue-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows="6"
              required
            />

            {message && <p className="success-message">{message}</p>}

            <button type="submit">Submit Report</button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default ReportIssue;
