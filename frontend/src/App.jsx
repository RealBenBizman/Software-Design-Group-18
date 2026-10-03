import React, { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate
} from 'react-router-dom';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import Dashboard from './Pages/Dashboard';
import JoinQueue from './Pages/JoinQueue';
import QueueStatus from './Pages/QueueStatus';
import Appointments from './pages/student/Appointments';
import History from './pages/student/History';
import Settings from './pages/student/Settings';
import Help from './pages/student/Help';
import ReportIssue from './pages/student/ReportIssue';


function MainApp() {
  const [currScreen, SetCurrScreen] = useState('dashboard');
  const navigate = useNavigate();

  // Simulated logout for frontend-only application
  function handleLogout() {
    navigate('/login');
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        fontFamily: 'sans-serif'
      }}
    >

      {/* Navigation Bar */}
      <nav
        style={{
          backgroundColor: '#000080',
          paddingTop: '14px',
          paddingBottom: '14px',
          paddingRight: '28px',
          paddingLeft: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 3px 6px rgba(0,0,0,0.1)'
        }}
      >

        {/* Program Name */}
        <div
          style={{
            color: '#ffffff',
            fontSize: '25px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            marginLeft: '0px'
          }}
        >
          NEBB Queue
        </div>

        {/* Top Navigation Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px'
          }}
        >

          {/* Dashboard */}
          <button
            onClick={() => SetCurrScreen('dashboard')}
            style={{
              padding: '8px 15px',
              backgroundColor:
                currScreen === 'dashboard' ? '#82C8E5' : 'transparent',
              color:
                currScreen === 'dashboard' ? '#000080' : 'white',
              border: '2px solid #82C8E5',
              borderRadius: '5px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Dashboard
          </button>

          {/* Join Queue */}
          <button
            onClick={() => SetCurrScreen('join')}
            style={{
              padding: '8px 15px',
              backgroundColor:
                currScreen === 'join' ? '#82C8E5' : 'transparent',
              color:
                currScreen === 'join' ? '#000080' : 'white',
              border: '2px solid #82C8E5',
              borderRadius: '5px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Join Queue
          </button>

          {/* Queue Status */}
          <button
            onClick={() => SetCurrScreen('status')}
            style={{
              padding: '8px 15px',
              backgroundColor:
                currScreen === 'status' ? '#82C8E5' : 'transparent',
              color:
                currScreen === 'status' ? '#000080' : 'white',
              border: '2px solid #82C8E5',
              borderRadius: '5px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Queue Status
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 15px',
              backgroundColor: 'transparent',
              color: 'white',
              border: '2px solid white',
              borderRadius: '5px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>

        </div>
      </nav>

      {/* Display Selected Screen */}
      <main style={{ padding: '18px' }}>
        {currScreen === 'dashboard' && <Dashboard />}
        {currScreen === 'join' && <JoinQueue />}
        {currScreen === 'status' && <QueueStatus />}
      </main>

    </div>
  );
}


export default function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Authentication */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* Main Student Application */}
        <Route
          path="/dashboard"
          element={<MainApp />}
        />

        {/* Student Pages */}
        <Route
          path="/appointments"
          element={<Appointments />}
        />

        <Route
          path="/history"
          element={<History />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />

        <Route
          path="/help"
          element={<Help />}
        />

        <Route
          path="/report-issue"
          element={<ReportIssue />}
        />

        {/* Unknown URL -> Login */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>

    </BrowserRouter>
  );
}