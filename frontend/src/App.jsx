
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import StaffLogin from './Pages/auth/StaffLogin';

import Dashboard from './Pages/Dashboard';
import JoinQueue from './Pages/JoinQueue';
import QueueStatus from './Pages/QueueStatus';

import Appointments from './pages/student/Appointments';
import History from './pages/student/History';
import Notifications from './pages/student/Notifications';
import Settings from './pages/student/Settings';
import Help from './pages/student/Help';
import ReportIssue from './pages/student/ReportIssue';

import AdminApp from './pages/admin/AdminApp';
import EmployeeApp from './pages/employee/EmployeeApp';

import AccountLayout from './components/AccountLayout';
import StudentNavbar from './components/StudentNavbar';
import ProtectedRoute from './components/ProtectedRoute';


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


/*
  Displayed when a logged-in user attempts
  to access a page outside their assigned role.
*/
function Unauthorized() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '80px 20px',
        fontFamily: 'sans-serif'
      }}
    >
      <h1>403 - Access Denied</h1>

      <p>
        You do not have permission to access this page.
      </p>

      <a href="/login">
        Return to Login
      </a>
    </div>
  );
}


export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Authentication Pages */}
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

        <Route
          path="/staff-login"
          element={<StaffLogin />}
        />

        <Route
          path="/unauthorized"
          element={<Unauthorized />}
        />


        {/* Student-Only Pages */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['student']} />
          }
        >

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
            path="/notifications"
            element={
              <StudentLayout>
                <Notifications />
              </StudentLayout>
            }
          />



        </Route>


        <Route element={<ProtectedRoute allowedRoles={['student', 'employee', 'admin']} />}>
          <Route path="/settings" element={<AccountLayout><Settings /></AccountLayout>} />
          <Route path="/help" element={<AccountLayout><Help /></AccountLayout>} />
          <Route path="/report-issue" element={<AccountLayout><ReportIssue /></AccountLayout>} />
        </Route>

        {/* Employee-Only Pages */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['employee']} />
          }
        >
          <Route
            path="/employee"
            element={<EmployeeApp />}
          />
        </Route>


        {/* Admin-Only Pages */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['admin']} />
          }
        >
          <Route
            path="/admin"
            element={<AdminApp />}
          />
        </Route>


        {/* Unknown URL */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}
