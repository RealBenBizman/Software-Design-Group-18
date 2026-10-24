import { Link } from "react-router-dom";
import QueueNotifications from "../../components/QueueNotifications";
import "../../styles/Student.css";

function Notifications() {
  return (
    <div className="student-page">
      <div className="student-container narrow-container">
        <div className="student-heading">
          <div>
            <h1>Notifications</h1>
            <p>Updates about your queue visits.</p>
          </div>
          <Link to="/history">View History</Link>
        </div>
        <QueueNotifications />
      </div>
    </div>
  );
}

export default Notifications;
