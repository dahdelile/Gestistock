// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole, requiredPermissions }) => {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  
  if (!token) {
    return <Navigate to="/pageConnection" replace />;
  }

  // Optional: Role/permission checks
  const user = JSON.parse(
    localStorage.getItem('user') || sessionStorage.getItem('user') || '{}'
  );

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredPermissions && !requiredPermissions.every(p => user.permissions?.includes(p))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;