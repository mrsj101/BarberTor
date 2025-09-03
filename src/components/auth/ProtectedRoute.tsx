import { useSession } from '@/contexts/SessionContext';
import { Navigate, Outlet } from 'react-router-dom';
import * as React from 'react';

const ProtectedRoute = () => {
  const { session, loading } = useSession();

  // While the session is loading, we don't render anything.
  // The App.tsx splash screen will be visible during this time.
  if (loading) {
    return null;
  }

  // If there is a session, render the child routes.
  // If not, navigate to the welcome page.
  return session ? <Outlet /> : <Navigate to="/welcome" replace />;
};

export default ProtectedRoute;
