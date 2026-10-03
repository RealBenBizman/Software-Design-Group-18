import { Link } from "react-router-dom";
import "../../styles/Student.css";

const questions = [
  {
    question: "How do I book an appointment?",
    answer: "Open the Appointments page, select a service, choose a future date and time, and submit the form.",
  },
  {
    question: "Can I book an appointment for today?",
    answer: "No. Appointments must be scheduled for a future date. Use the same-day queue when you need help today.",
  },
  {
    question: "How do I cancel an appointment?",
    answer: "Find the appointment under Upcoming Appointments and select Cancel Appointment.",
  },
  {
    question: "Where can I see my previous visits?",
    answer: "The History page displays past queues and appointments with their dates and outcomes.",
  },
  {
    question: "How do I update my profile?",
    answer: "Open Settings, update your name, email, or phone number, and select Save Changes.",
  },
];

function Help() {
  return (
    <div className="student-page">
      <div className="student-container narrow-container">
        <div className="student-heading">
          <div>
            <h1>Help & FAQ</h1>
            <p>Find answers to common questions about appointments and your account.</p>
          </div>
        </div>

        <section className="student-card">
          {questions.map((item) => (
            <details className="faq-item" key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}

          <div className="help-footer">
            <p>Still need help?</p>
            <Link className="student-button-link" to="/report-issue">Report an Issue</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Help;
