import React, { useMemo } from 'react';
import {
  Home as HomeIcon,
  Building,
  Plus,
  Users,
  Briefcase,
  Settings,
  Info,
  LogOut,
  Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { useAuth } from '../../contexts/AuthContext';

export default function AgencySidebar({ activeTab, onTabChange }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  const menuItems = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: HomeIcon,
      onClick: () => {
        onTabChange('dashboard');
        navigate('/agency-dashboard');
      }
    },
    {
      id: 'properties',
      label: 'Properties',
      icon: Building,
      onClick: () => {
        onTabChange('properties');
        navigate('/agency-dashboard/properties');
      }
    },
    {
      id: 'agents',
      label: 'Agents',
      icon: Users,
      onClick: () => {
        onTabChange('agents');
        navigate('/agency-dashboard/agents');
      }
    },
    {
      id: 'jobs',
      label: 'Jobs',
      icon: Briefcase,
      onClick: () => {
        onTabChange('jobs');
        navigate('/agency-dashboard/jobs');
      }
    },
    {
      id: 'developers',
      label: 'Developers',
      icon: Building2,
      onClick: () => {
        onTabChange('developers');
        navigate('/agency-dashboard/developers');
      }
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: () => {
        onTabChange('settings');
        navigate('/agency-dashboard/settings');
      }
    }
  ], [navigate, onTabChange]);

  const actionItems = useMemo(() => [
    {
      id: 'add-property',
      label: 'Add Property',
      icon: Plus,
      onClick: () => navigate('/add-property')
    }
  ], [navigate]);

  return (
    <Sidebar
      menuItems={menuItems}
      actionItems={actionItems}
      activeTab={activeTab}
      onTabChange={onTabChange}
      onLogout={handleLogout}
      logoSrc="https://edcsftvorssaojmyfqgs.supabase.co/storage/v1/object/public/homepage-assets//png%20100%20x%20100%20(1).png"
      appName="AgentVerify"
    />
  );
}
