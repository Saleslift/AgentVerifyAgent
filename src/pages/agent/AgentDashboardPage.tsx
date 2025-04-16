import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AgentSidebar from '../../components/agent/AgentSidebar';
import PropertyManagement from '../../components/PropertyManagement';
import JobsTab from '../../components/agent/JobsTab';
import StatisticsPanel from '../../components/agent/StatisticsPanel';
import AgentProjectsTab from '../../components/agent/AgentProjectsTab';
import MarketplaceTab from '../../components/MarketplaceTab';
import NotificationsTab from '../../components/agent/NotificationsTab';
import ContactsPage from './ContactsPage';
import EditProfilePage from '../EditProfilePage';
import { useAuth } from '../../contexts/AuthContext';
import { useUserData } from '../../hooks/useUserData';
import { initPageVisibilityHandling, cleanupPageVisibilityHandling } from '../../utils/pageVisibility';
import DealsPage from "../crm/DealsPage";

export default function AgentDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, properties, loading, error } = useUserData();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-properties' | 'marketplace' | 'statistics' | 'jobs' | 'projects' | 'notifications' | 'edit-profile' | 'contacts' | 'crm-deals'>('my-properties');

  // Initialize page visibility handling to prevent reloads
  useEffect(() => {
    initPageVisibilityHandling();
    return () => cleanupPageVisibilityHandling();
  }, []);

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
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            agentId={user.id}
            activeTab={activeTab}
            onTabChange={setActiveTab}
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
                // Show DealsPage component when crm-deals tab is active
                <DealsPage />
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
