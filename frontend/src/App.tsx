import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ConferenceSelection from './pages/ConferenceSelection';
import DashboardRouter from './pages/DashboardRouter';
import AuthorDashboard from './pages/AuthorDashboard';
import ReviewerDashboard from './pages/ReviewerDashboard';
import ChairDashboard from './pages/ChairDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/conferences" element={<ConferenceSelection />} />
      <Route path="/conferences/:id/dashboard" element={<DashboardRouter />} />

      <Route element={<ProtectedRoute requiredRole="AUTHOR" />}>
        <Route element={<DashboardLayout title="Author Dashboard" />}>
          <Route path="/conferences/:id/author" element={<AuthorDashboard />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute requiredRole="REVIEWER" />}>
        <Route element={<DashboardLayout title="Reviewer Dashboard" color="default" />}>
          <Route path="/conferences/:id/reviewer" element={<ReviewerDashboard />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute requiredRole="CHAIR" />}>
        <Route element={<DashboardLayout title="Chair Dashboard" color="secondary" />}>
          <Route path="/conferences/:id/chair" element={<ChairDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
