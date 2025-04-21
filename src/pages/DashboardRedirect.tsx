import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRoleAuth } from '../hooks/useRoleAuth';

export default function DashboardRedirect() {
  const { role, loading, debugRoleInfo } = useRoleAuth();
  const { user } = useAuth();

  // For debugging purposes
  React.useEffect(() => {
    if (user && role === null && !loading) {

      debugRoleInfo().then(info => {
        console.log('Role debug info:', info);
      });
    }
  }, [user, role, loading, debugRoleInfo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-300"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to signin if not logged in
    return <Navigate to="/signin" />;
  }

  // Only set navigation flag when we have a valid role and are ready to redirect
  if (role) {
    // Set flag to allow navigation
    sessionStorage.setItem('intentional_navigation', 'true');

    switch (role) {
      case 'agency':
        return  <Navigate to="/agency-dashboard" replace />;
      case 'developer':
        return  <Navigate to="/developer-dashboard" replace />;
      case 'agent':
        return  <Navigate to="/agent-dashboard" replace />;
      default:
        return  <Navigate to="/agent-dashboard" replace />;
    }
  }

  // If we get here, we have a user but no role yet - show loading state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-300 mb-4"></div>
      <p className="text-gray-600">Loading your profile...</p>
      <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-black text-white rounded-md"
      >
        Reload Page
      </button>
    </div>
  );
}
