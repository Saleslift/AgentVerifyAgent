import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserDataContext } from '../contexts/UserDataContext';
import AgencyProperties from '../components/agency/AgencyProperties';
import AgencyAgents from '../components/agency/AgencyAgents';
import AgencyJobs from '../components/agency/AgencyJobs';
import AgencySettings from '../components/agency/AgencySettings';
import AgencyDashboardHome from '../components/agency/AgencyDashboardHome';
import AgencyDevelopers from '../components/agency/AgencyDevelopers';
import AgencySidebar from '../components/agency/AgencySidebar';

export default function AgencyDashboardPage() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile, loading, error } = useUserDataContext();
  const [activeTab, setActiveTab] = useState(location.pathname.split('/')[2] || 'dashboard');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (profile && profile?.role !== 'agency') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            This dashboard is only available for agency accounts. Your current role is: {profile?.role}
          </p>
          <Navigate to="/dashboard" replace />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <AgencySidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <main
        className={`
          transition-all duration-300 
          md:ml-[70px]
          pt-20 md:pt-8 
          px-4 md:px-8 lg:px-12
        `}
      >
        <div className="p-8">
          <Routes>
            <Route index element={<AgencyDashboardHome />} />
            <Route path="dashboard" element={<AgencyDashboardHome />} />
            <Route path="properties" element={<AgencyProperties />} />
            <Route path="agents" element={<AgencyAgents />} />
            <Route path="jobs/*" element={<AgencyJobs />} />
            <Route path="developers" element={<AgencyDevelopers />} />
            <Route path="settings" element={<AgencySettings />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
