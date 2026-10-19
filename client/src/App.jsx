import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import StudentForm from './pages/StudentForm.jsx';
import StudentDetail from './pages/StudentDetail.jsx';
import FeesPlans from './pages/FeesPlans.jsx';
import Payments from './pages/Payments.jsx';
import Reminders from './pages/Reminders.jsx';
import Settings from './pages/Settings.jsx';
import Workspaces from './pages/Workspaces.jsx';
import Team from './pages/Team.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import Attendance from './pages/Attendance.jsx';
import Discounts from './pages/Discounts.jsx';
import DietPlans from './pages/DietPlans.jsx';
import StudentSelfCheckIn from './pages/StudentSelfCheckIn.jsx';
import NotFound from './pages/NotFound.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { Loading } from './components/ui/Loader.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loading label="Loading workspace…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={!loading && isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={!loading && isAuthenticated ? <Navigate to="/" replace /> : <Register />}
      />
      {/* Zero-Hardware Desk QR Self Check-In for Students */}
      <Route path="/checkin/:slug" element={<StudentSelfCheckIn />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/students/new" element={<StudentForm />} />
        <Route path="/students/:id" element={<StudentDetail />} />
        <Route path="/students/:id/edit" element={<StudentForm />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/diet-plans" element={<DietPlans />} />
        <Route path="/discounts" element={<Discounts />} />
        <Route path="/fees" element={<FeesPlans />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/team" element={<Team />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/workspaces" element={<Workspaces />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
