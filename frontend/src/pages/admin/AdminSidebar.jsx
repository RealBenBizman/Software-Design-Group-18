import { useNavigate } from "react-router-dom";

function AdminSidebar({ page, setPage, menuOpen, setMenuOpen }) {
  const navigate = useNavigate();
  const goTo = (nextPage) => {
    setPage(nextPage);
    setMenuOpen(false);
  };

  const goToSettings = () => {
    setMenuOpen(false);
    navigate("/settings");
  };

  const signOut = () => {
    navigate("/login");
  };

  return (
    <>
      {menuOpen && (
        <button
          className="admin-menu-overlay"
          onClick={() => setMenuOpen(false)}
          aria-label="close menu"
        />
      )}

      <aside className={`admin-sidebar ${menuOpen ? "show-menu" : ""}`}>
        <div className="admin-brand">
          <h1>NEBB Queue</h1>
          <p>administrator portal</p>
        </div>

        <nav className="admin-nav">
          <button
            className={page === "dashboard" ? "admin-nav-active" : ""}
            onClick={() => goTo("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={page === "queues" ? "admin-nav-active" : ""}
            onClick={() => goTo("queues")}
          >
            Queue Management
          </button>

          <button
            className={page === "services" ? "admin-nav-active" : ""}
            onClick={() => goTo("services")}
          >
            Service Management
          </button>

          <button
            className={page === "employees" ? "admin-nav-active" : ""}
            onClick={() => goTo("employees")}
          >
            Employees
          </button>

          <button
            className={page === "reports" ? "admin-nav-active" : ""}
            onClick={() => goTo("reports")}
          >
            Reports
          </button>

          <button onClick={goToSettings}>
            Settings
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <span>signed in as</span>
          <strong>Administrator</strong>

          <button
            className="admin-sign-out-button"
            onClick={signOut}
          >
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
