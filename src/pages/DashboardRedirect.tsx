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
      console.log('DashboardRedirect: Role is null but user exists, debugging...');
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

    // Log the role for debugging
    console.log('DashboardRedirect: Redirecting based on role:', role);

    // Always redirect to agent dashboard
    return <Navigate to="/agent-dashboard" replace />;
  }

  // If we get here, we have a user but no role yet - show loading state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-300 mb-4"></div>
      <p className="text-gray-600">Loading your profile...</p>
    </div>
  );
}