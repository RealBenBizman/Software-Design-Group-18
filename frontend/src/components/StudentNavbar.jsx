
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../styles/StudentNavbar.css';

function StudentNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navigate = useNavigate();

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      const response = await fetch(
        'http://localhost:3001/api/auth/logout',
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Close the mobile navigation menu
      setMenuOpen(false);

      // Redirect after the server destroys the session
      navigate('/login', { replace: true });

    } catch (error) {
      console.error('Logout error:', error);
      alert('Unable to log out. Please try again.');

    } finally {
      setLoggingOut(false);
    }
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
          disabled={loggingOut}
        >
          {loggingOut ? 'Logging out...' : 'Logout'}
        </button>

      </div>

    </nav>
  );
}

export default StudentNavbar;
