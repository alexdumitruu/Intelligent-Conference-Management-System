import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  requiredRole: string;
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const token = localStorage.getItem('accessToken');
  const role = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
