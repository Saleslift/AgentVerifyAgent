// Fully upgraded Agency Sidebar matching AgentSidebar behavior
import React, { useState, useRef } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  HomeIcon, Building, Plus, Users, Briefcase,
  Settings, Info, LogOut, Building2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserDataContext } from '../contexts/UserDataContext';

import AgencyProperties from '../components/agency/AgencyProperties';
import AgencyAgents from '../components/agency/AgencyAgents';
import AgencyJobs from '../components/agency/AgencyJobs';
import AgencySettings from '../components/agency/AgencySettings';
import AgencyDashboardHome from '../components/agency/AgencyDashboardHome';
import AgencyDevelopers from '../components/agency/AgencyDevelopers';

const IconSize = 20;

export default function AgencyDashboardPage() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile, loading, error } = useUserDataContext();
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeout = useRef(null);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <Building className="h-12 w-12 text-red-500 mx-auto mb-4" />
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

  if (!user) return <Navigate to="/signin" />;
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
    </div>
  );

  if (profile && profile.role !== 'agency') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <Building className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            This dashboard is only available for agency accounts. Your current role is: {profile.role}
          </p>
          <Link to="/dashboard" className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 inline-block">
            Go to Your Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getActiveClass = (path) => {
    const currentPath = location.pathname;
    return currentPath === path ? 'bg-[#CEFA05] text-black' : 'text-white hover:bg-white/10';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={`fixed h-full bg-black text-white z-40 flex flex-col transition-all duration-300 ease-in-out ${isHovered ? 'w-[250px]' : 'w-[70px]'}`}
        onMouseEnter={() => {
          clearTimeout(hoverTimeout.current);
          hoverTimeout.current = setTimeout(() => setIsHovered(true), 100);
        }}
        onMouseLeave={() => {
          clearTimeout(hoverTimeout.current);
          hoverTimeout.current = setTimeout(() => setIsHovered(false), 150);
        }}
      >
        <div className="h-20 flex items-center px-4 border-b border-white/10">
          <img
            src="https://edcsftvorssaojmyfqgs.supabase.co/storage/v1/object/public/homepage-assets//png%20100%20x%20100%20(1).png"
            alt="AgentVerify Logo"
            className="h-8 w-8"
          />
          {isHovered && <span className="ml-3 text-white text-lg font-medium">AgentVerify</span>}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link to="/agency-dashboard" className={`flex items-center w-full px-3 py-2 rounded-lg transition-all duration-200 ${getActiveClass('/agency-dashboard')} ${isHovered ? 'justify-start' : 'justify-center'} gap-x-3`}>
            <div className="min-w-[20px] flex justify-center items-center"><HomeIcon size={IconSize} /></div>
            {isHovered && <span className="text-left font-medium">Dashboard</span>}
          </Link>

          <Link to="/agency-dashboard/properties" className={`flex items-center w-full px-3 py-2 rounded-lg transition-all duration-200 ${getActiveClass('/agency-dashboard/properties')} ${isHovered ? 'justify-start' : 'justify-center'} gap-x-3`}>
            <div className="min-w-[20px] flex justify-center items-center"><Building size={IconSize} /></div>
            {isHovered && <span className="text-left font-medium">Properties</span>}
          </Link>

          <Link to="/add-property" className={`flex items-center w-full px-3 py-2 rounded-lg bg-white text-black font-medium ${isHovered ? 'justify-start' : 'justify-center'} gap-x-3`}>
            <div className="min-w-[20px] flex justify-center items-center"><Plus size={IconSize} /></div>
            {isHovered && <span className="text-left font-medium">Add Property</span>}
          </Link>

          <Link to="/agency-dashboard/agents" className={`flex items-center w-full px-3 py-2 rounded-lg transition-all duration-200 ${getActiveClass('/agency-dashboard/agents')} ${isHovered ? 'justify-start' : 'justify-center'} gap-x-3`}>
            <div className="min-w-[20px] flex justify-center items-center"><Users size={IconSize} /></div>
            {isHovered && <span className="text-left font-medium">Agents</span>}
          </Link>

          <Link to="/agency-dashboard/jobs" className={`flex items-center w-full px-3 py-2 rounded-lg transition-all duration-200 ${getActiveClass('/agency-dashboard/jobs')} ${isHovered ? 'justify-start' : 'justify-center'} gap-x-3`}>
            <div className="min-w-[20px] flex justify-center items-center"><Briefcase size={IconSize} /></div>
            {isHovered && <span className="text-left font-medium">Jobs</span>}
          </Link>

          <Link to="/agency-dashboard/developers" className={`flex items-center w-full px-3 py-2 rounded-lg transition-all duration-200 ${getActiveClass('/agency-dashboard/developers')} ${isHovered ? 'justify-start' : 'justify-center'} gap-x-3`}>
            <div className="min-w-[20px] flex justify-center items-center"><Building2 size={IconSize} /></div>
            {isHovered && <span className="text-left font-medium">Developers</span>}
          </Link>

          <Link to="/agency-dashboard/settings" className={`flex items-center w-full px-3 py-2 rounded-lg transition-all duration-200 ${getActiveClass('/agency-dashboard/settings')} ${isHovered ? 'justify-start' : 'justify-center'} gap-x-3`}>
            <div className="min-w-[20px] flex justify-center items-center"><Settings size={IconSize} /></div>
            {isHovered && <span className="text-left font-medium">Settings</span>}
          </Link>
        </nav>

        <div className="border-t border-white/10 w-full"></div>

        <div className="px-3 py-4">
          <a href="https://wa.me/971543106444" target="_blank" rel="noopener noreferrer" className={`flex items-center w-full px-3 py-2 text-white hover:bg-white/10 rounded-lg mb-2 ${isHovered ? 'justify-start' : 'justify-center'} gap-x-3`}>
            <div className="min-w-[20px] flex justify-center items-center"><Info size={IconSize} /></div>
            {isHovered && <span className="text-left font-medium">Support</span>}
          </a>
          <button onClick={handleSignOut} className={`flex items-center w-full px-3 py-2 text-white hover:bg-white/10 rounded-lg ${isHovered ? 'justify-start' : 'justify-center'} gap-x-3`}>
            <div className="min-w-[20px] flex justify-center items-center"><LogOut size={IconSize} /></div>
            {isHovered && <span className="text-left font-medium">Log Out</span>}
          </button>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ease-in-out ${isHovered ? 'ml-[250px]' : 'ml-[70px]'}`}>
        <div className="p-8">
          <Routes>
            <Route path="/" element={<AgencyDashboardHome />} />
            <Route path="/properties/*" element={<AgencyProperties />} />
            <Route path="/agents/*" element={<AgencyAgents />} />
            <Route path="/jobs/*" element={<AgencyJobs />} />
            <Route path="/developers/*" element={<AgencyDevelopers />} />
            <Route path="/settings" element={<AgencySettings />} />
            <Route path="*" element={<Navigate to="/agency-dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
