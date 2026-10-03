import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../styles/StudentNavbar.css';

function StudentNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  function handleLogout() {
    navigate('/login');
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className="student-navbar">

      <div className="navbar-brand">
        NEBB Queue
      </div>

      {/* Mobile hamburger button */}
      <button
        className="navbar-menu-button"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation menu"
      >
        ☰
      </button>

      <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>

        <NavLink to="/dashboard" onClick={closeMenu}>
          Dashboard
        </NavLink>

        <NavLink to="/join-queue" onClick={closeMenu}>
          Join Queue
        </NavLink>

        <NavLink to="/queue-status" onClick={closeMenu}>
          Queue Status
        </NavLink>

        <NavLink to="/appointments" onClick={closeMenu}>
          Appointments
        </NavLink>

        <NavLink to="/history" onClick={closeMenu}>
          History
        </NavLink>

        <NavLink to="/settings" onClick={closeMenu}>
          Settings
        </NavLink>

        <NavLink to="/help" onClick={closeMenu}>
          Help
        </NavLink>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

    </nav>
  );
}

export default StudentNavbar;