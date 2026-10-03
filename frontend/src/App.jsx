import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
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

import StudentNavbar from './components/StudentNavbar';


/*
  Shared layout for all student pages.
  The navbar stays visible while the page content changes.
*/
function StudentLayout({ children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        fontFamily: 'sans-serif'
      }}
    >
      <StudentNavbar />

      <main style={{ padding: '18px' }}>
        {children}
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


        {/* Student Queue Pages */}
        <Route
          path="/dashboard"
          element={
            <StudentLayout>
              <Dashboard />
            </StudentLayout>
          }
        />

        <Route
          path="/join-queue"
          element={
            <StudentLayout>
              <JoinQueue />
            </StudentLayout>
          }
        />

        <Route
          path="/queue-status"
          element={
            <StudentLayout>
              <QueueStatus />
            </StudentLayout>
          }
        />


        {/* Student Account Pages */}
        <Route
          path="/appointments"
          element={
            <StudentLayout>
              <Appointments />
            </StudentLayout>
          }
        />

        <Route
          path="/history"
          element={
            <StudentLayout>
              <History />
            </StudentLayout>
          }
        />

        <Route
          path="/settings"
          element={
            <StudentLayout>
              <Settings />
            </StudentLayout>
          }
        />

        <Route
          path="/help"
          element={
            <StudentLayout>
              <Help />
            </StudentLayout>
          }
        />

        <Route
          path="/report-issue"
          element={
            <StudentLayout>
              <ReportIssue />
            </StudentLayout>
          }
        />


        {/* Unknown URL */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>

    </BrowserRouter>
  );
}