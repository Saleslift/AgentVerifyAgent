import React, {useEffect, useMemo, useState} from 'react';
import {
  Bell,
  Building2,
  UserCog,
  BarChart2,
  Briefcase,
  ExternalLink,
  Plus,
  Building,
  Users,
  Folder,
  Home,
  Store,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRoleAuth } from '../../hooks/useRoleAuth';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../Sidebar';

export default function AgentSidebar({ agentId, activeTab, onTabChange, agentSlug }) {
  const navigate = useNavigate();
  const { role } = useRoleAuth();
  const { signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (role && role !== 'agent') {
      navigate('/dashboard');
    }
  }, [role, navigate]);

  const handleLogout = async () => {
    await signOut();
  };

  const menuItems = useMemo(() => [
    {
      id: 'public-profile',
      label: 'View Public Profile',
      icon: ExternalLink,
      onClick: () => window.open(`/agent/${agentSlug || agentId}`, '_blank'),
      external: true
    },
    {
      id: 'edit-profile',
      label: 'Edit Public Profile',
      icon: UserCog,
      onClick: () => onTabChange('edit-profile')
    },
    {
      id: 'properties',
      label: 'Properties',
      icon: Building2,
      hasSubmenu: true,
      onClick: () => {}, // Ensure this is defined to prevent default behavior
      submenu: [
        { id: 'my-properties', label: 'My Properties', icon: Home, onClick: () => onTabChange('my-properties') },
        { id: 'add-property', label: 'Add Property', icon: Plus, onClick: () => onTabChange('add-property') },
        { id: 'marketplace', label: 'Marketplace', icon: Store, onClick: () => onTabChange('marketplace') },
        { id: 'projects', label: 'Projects', icon: Building, onClick: () => onTabChange('projects') }
      ]
    },
    {
      id: 'notifications', label: 'Notifications', icon: Bell,
      onClick: () => onTabChange('notifications'), badge: unreadCount > 0 ? unreadCount : undefined
    },
    {
      id: 'crm',
      label: 'CRM',
      icon: Folder,
      hasSubmenu: true,
      onClick: () => {}, // Ensure this is defined to prevent default behavior
      submenu: [
        { id: 'contacts', label: 'Leads', icon: Users, onClick: () => onTabChange('contacts') },
        { id: 'crm-deals', label: 'Deals', icon: FileText, onClick: () => onTabChange('crm-deals') }
      ]
    },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, onClick: () => onTabChange('jobs') },
    // { id: 'statistics', label: 'Statistics', icon: BarChart2, onClick: () => onTabChange('statistics') }
  ], [agentId, agentSlug, onTabChange]);

  return (
    <Sidebar
      menuItems={menuItems}
      activeTab={activeTab}
      onTabChange={onTabChange}
      onLogout={handleLogout}
      logoSrc="https://edcsftvorssaojmyfqgs.supabase.co/storage/v1/object/public/homepage-assets//png%20100%20x%20100%20(1).png"
      appName="AgentVerify"
    />
  );
}
