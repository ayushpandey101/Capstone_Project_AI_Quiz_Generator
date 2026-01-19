import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/contexts/AuthContext';
import Loader from '../../components/Loader';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // Show loading state
  if (loading) {
    return <Loader />;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check role authorization
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to their appropriate dashboard based on their actual role
    if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user?.role === 'candidate') {
      return <Navigate to="/candidate/my-classes" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  // Authorized - render children
  return <>{children}</>;
};

export default ProtectedRoute;
