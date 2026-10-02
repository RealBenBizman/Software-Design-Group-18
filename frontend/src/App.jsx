import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Appointments from "./pages/student/Appointments";
import History from "./pages/student/History";
import Settings from "./pages/student/Settings";
import Help from "./pages/student/Help";
import ReportIssue from "./pages/student/ReportIssue";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/appointments" replace />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<Help />} />
        <Route path="/report-issue" element={<ReportIssue />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
