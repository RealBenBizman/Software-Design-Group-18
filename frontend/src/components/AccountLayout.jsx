import { Link, useOutletContext } from "react-router-dom";
import StudentNavbar from "./StudentNavbar";

export default function AccountLayout({ children }) {
  const { user } = useOutletContext();
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa", fontFamily: "sans-serif" }}>
      {user.role === "student" ? <StudentNavbar /> : (
        <nav style={{ display: "flex", flexWrap: "wrap", gap: 20, padding: 20 }} aria-label="Account navigation">
          <Link to={user.role === "admin" ? "/admin" : "/employee"}>Back to {user.role === "admin" ? "Admin" : "Employee"} Portal</Link>
          <Link to="/settings">Settings</Link>
          <Link to="/help">Help</Link>
          <Link to="/report-issue">Report an Issue</Link>
        </nav>
      )}
      <main style={{ padding: 18 }}>{children}</main>
    </div>
  );
}
