import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BannedScreen from './BannedScreen';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser, userProfile } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (userProfile?.isBanned) {
    return <BannedScreen />;
  }

  if (adminOnly && userProfile?.role !== 'admin') {
    return <Navigate to="/dashboard?restricted=true" replace />;
  }

  return children;
};

export default ProtectedRoute;
