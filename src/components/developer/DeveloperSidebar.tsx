import React, { useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  UserCog,
  BarChart2,
  Users,
  ExternalLink,
  Upload,
  Code,
  PlusCircle,
  Rocket,
  Layers
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRoleAuth } from '../../hooks/useRoleAuth';
import { supabase } from '../../utils/supabase';
import Sidebar from '../Sidebar';

export default function DeveloperSidebar({
  developerId,
  activeTab,
  onTabChange
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { role } = useRoleAuth();
  const [developerSlug, setDeveloperSlug] = React.useState<string>('');

  useEffect(() => {
    if (role && role !== 'developer') {
      navigate('/dashboard');
    }
  }, [role, navigate]);

  useEffect(() => {
    const fetchDeveloperSlug = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('slug')
          .eq('id', developerId)
          .single();

        if (data?.slug) {
          setDeveloperSlug(data.slug);
        }
      } catch (error) {
        console.error('Error fetching developer slug:', error);
      }
    };

    if (developerId) {
      fetchDeveloperSlug();
    }
  }, [developerId]);

  const handleLogout = async () => {
    sessionStorage.setItem('intentional_navigation', 'true');
    await signOut();
  };

  const menuItems = useMemo(() => [
    {
      id: 'edit-profile',
      label: 'Edit Profile',
      icon: UserCog,
      onClick: () => {
        onTabChange('edit-profile');
        navigate('/developer-dashboard');
      }
    },
    {
      id: 'public-page',
      label: 'Public Page',
      icon: ExternalLink,
      onClick: () => navigate(`/developers/${developerSlug || ''}`),
      external: true
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: Building2,
      onClick: () => {
        onTabChange('projects');
        navigate('/developer-dashboard');
      }
    },
    {
      id: 'units',
      label: 'Units Management',
      icon: Layers,
      onClick: () => {
        onTabChange('units');
        navigate('/developer-dashboard');
      }
    },
    {
      id: 'import-projects',
      label: 'Import Projects',
      icon: Upload,
      onClick: () => {
        onTabChange('import-projects');
        navigate('/developer-dashboard');
      }
    },
    {
      id: 'api',
      label: 'API Integration',
      icon: Code,
      onClick: () => {
        onTabChange('api');
        navigate('/developer-dashboard');
      }
    },
    {
      id: 'agencies',
      label: 'Agencies',
      icon: Users,
      onClick: () => {
        onTabChange('agencies');
        navigate('/developer-dashboard');
      }
    },
    {
      id: 'statistics',
      label: 'Statistics',
      icon: BarChart2,
      onClick: () => {
        onTabChange('statistics');
        navigate('/developer-dashboard');
      }
    }
  ], [navigate, onTabChange, developerSlug]);

  const actionItems = useMemo(() => [
    {
      id: 'create-project',
      label: 'Add a New Project',
      icon: PlusCircle,
      onClick: () => navigate('/developer-dashboard/create-project')
    },
    {
      id: 'create-prelaunch',
      label: 'Add a Prelaunch',
      icon: Rocket,
      onClick: () => navigate('/developer-dashboard/create-prelaunch')
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
