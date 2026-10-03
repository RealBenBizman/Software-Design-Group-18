import { useNavigate } from "react-router-dom";

function EmployeeSidebar({
  page,
  setPage,
  selectedService,
  menuOpen,
  setMenuOpen,
}) {
  const navigate = useNavigate();
  const goTo = (nextPage) => {
    setPage(nextPage);
    setMenuOpen(false);
  };

  const goToRoute = (route) => {
    setMenuOpen(false);
    navigate(route);
  };

  const signOut = () => {
    navigate("/login");
  };

  return (
    <>
      {menuOpen && (
        <button
          className="menu-overlay"
          onClick={() => setMenuOpen(false)}
          aria-label="close menu"
        />
      )}

      <aside className={`employee-sidebar ${menuOpen ? "show-menu" : ""}`}>
        <div className="sidebar-brand">
          <h1>NEBB Queue</h1>
          <p>employee portal</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={page === "dashboard" ? "nav-active" : ""}
            onClick={() => goTo("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={page === "queue" ? "nav-active" : ""}
            onClick={() => goTo("queue")}
          >
            Queue Management
          </button>

          <button
            className={page === "appointments" ? "nav-active" : ""}
            onClick={() => goTo("appointments")}
          >
            Appointments
          </button>

          <button
            className={page === "services" ? "nav-active" : ""}
            onClick={() => goTo("services")}
          >
            Choose Service
          </button>

          <button onClick={() => goToRoute("/settings")}>
            Settings
          </button>

          <button onClick={() => goToRoute("/help")}>
            Help
          </button>

          <button onClick={() => goToRoute("/report-issue")}>
            Report Issue
          </button>
        </nav>

        <div className="sidebar-bottom">
          <span>working today</span>
          <strong>
            {selectedService ? selectedService.name : "no service selected"}
          </strong>

          <button
            className="sign-out-button"
            onClick={signOut}
          >
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

export default EmployeeSidebar;
