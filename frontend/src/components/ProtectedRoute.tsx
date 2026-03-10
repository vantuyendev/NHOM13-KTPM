import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}
