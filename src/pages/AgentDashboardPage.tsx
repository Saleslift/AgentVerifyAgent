import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AgentSidebar from '../components/agent/AgentSidebar';
import PropertyManagement from '../components/PropertyManagement';
import JobsTab from '../components/agent/JobsTab';
import StatisticsPanel from '../components/agent/StatisticsPanel';
import AgentProjectsTab from '../components/agent/AgentProjectsTab';
import MarketplaceTab from '../components/MarketplaceTab';
import NotificationsTab from '../components/agent/NotificationsTab';
import ContactsPage from './agent/ContactsPage';
import EditProfilePage from './EditAgentProfilePage';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';
import { initPageVisibilityHandling, cleanupPageVisibilityHandling } from '../utils/pageVisibility';
import DealsPage from "./crm/DealsPage.tsx";
import AddPropertyPage from "./AddPropertyPage.tsx";

type ActiveTabs = 'properties' | 'marketplace' | 'statistics' | 'jobs' | 'projects' | 'notifications' | 'edit-profile' | 'contacts' | 'my-properties' | 'crm-deals' | 'add-property';

export default function AgentDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { profile, properties, loading, error } = useUserData();

  const [activeTab, setActiveTab] = useState<ActiveTabs>('properties');

  // Initialize page visibility handling to prevent reloads
  useEffect(() => {
    initPageVisibilityHandling();
    return () => cleanupPageVisibilityHandling();
  }, []);

  useEffect(() => {
    // Map path to tab
    const pathToTab: Record<string, ActiveTabs> = {
      '/agent-dashboard/properties': 'properties',
      '/agent-dashboard/marketplace': 'marketplace',
      '/agent-dashboard/statistics': 'statistics',
      '/agent-dashboard/jobs': 'jobs',
      '/agent-dashboard/projects': 'projects',
      '/agent-dashboard/notifications': 'notifications',
      '/agent-dashboard/edit-profile': 'edit-profile',
      '/agent-dashboard/contacts': 'contacts',
      '/agent-dashboard/crm-deals': 'crm-deals',
      '/agent-dashboard/add-property': 'add-property',
      '/agent-dashboard/my-properties': 'my-properties',
    };
    const tab = pathToTab[location.pathname];
    if (tab && tab !== activeTab) setActiveTab(tab);
  }, [location.pathname]);

  const handleTabChange = (tab: ActiveTabs) => {
    setActiveTab(tab);
    // Map tab to path
    const tabToPath: Record<ActiveTabs, string> = {
      'properties': '/agent-dashboard/properties',
      'marketplace': '/agent-dashboard/marketplace',
      'statistics': '/agent-dashboard/statistics',
      'jobs': '/agent-dashboard/jobs',
      'projects': '/agent-dashboard/projects',
      'notifications': '/agent-dashboard/notifications',
      'edit-profile': '/agent-dashboard/edit-profile',
      'contacts': '/agent-dashboard/contacts',
      'crm-deals': '/agent-dashboard/crm-deals',
      'add-property': '/agent-dashboard/add-property',
      'my-properties': '/agent-dashboard/my-properties',
    };
    navigate(tabToPath[tab]);
  };

  // Check for invitation token in session storage
  useEffect(() => {
    const invitationToken = sessionStorage.getItem('invitationToken');
    if (invitationToken) {
      // Clear the token
      sessionStorage.removeItem('invitationToken');
      // Redirect to accept page
      navigate(`/accept?token=${invitationToken}`);
    }
  }, [navigate]);

  if (!user) {
    // Set flag to allow navigation
    sessionStorage.setItem('intentional_navigation', 'true');
    navigate('/signin');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <AgentSidebar
        agentId={user.id}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        agentSlug={profile?.slug}
      />

      <main
        className={`
          transition-all duration-300 
          md:ml-[70px]
          pt-20 md:pt-8 
          px-4 md:px-8 lg:px-12
        `}
      >
        <div className="max-w-[1600px] mx-auto">
          {/* Only show title for certain tabs */}
          {(activeTab === 'statistics' || activeTab === 'jobs' || activeTab === 'notifications') && (
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab === 'statistics' && 'Statistics'}
                {activeTab === 'jobs' && 'Jobs'}
                {activeTab === 'notifications' && 'Notifications'}
              </h1>
            </div>
          )}

          {activeTab === 'statistics' ? (
            <StatisticsPanel agentId={user.id} />
          ) : activeTab === 'jobs' ? (
            <JobsTab agentId={user.id} />
          ) : activeTab === 'marketplace' ? (
            <MarketplaceTab agentId={user.id} />
          ) : activeTab === 'projects' ? (
            <AgentProjectsTab />
          ) : activeTab === 'notifications' ? (
            <NotificationsTab />
          ) : activeTab === 'edit-profile' ? (
            <EditProfilePage />
          ) : activeTab === 'contacts' ? (
            <ContactsPage />
          ) : activeTab === 'crm-deals' ? (
              <DealsPage/>
          ) : activeTab === 'add-property' ? (
              <AddPropertyPage />
          ) : activeTab === 'my-properties' ? (
              <PropertyManagement
                  agentId={user.id}
                  properties={properties}
                  onDelete={(id) => {
                    // Handle delete
                    console.log('Delete property:', id);
                  }}
                  showAddButton={false}
                  showOriginTag={true} // Show origin tags in My Properties tab
              />
              ) : (
            <PropertyManagement
              agentId={user.id}
              properties={properties}
              onDelete={(id) => {
                // Handle delete
                console.log('Delete property:', id);
              }}
              showAddButton={false}
              showOriginTag={true} // Show origin tags in My Properties tab
            />
          )}
        </div>
      </main>
    </div>
  );
}
