// Fully upgraded AgentSidebar with flawless responsiveness and UX improvements
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, UserCog, BarChart2, Briefcase, LogOut,
  ExternalLink, HelpCircle, Plus, Building, Bell, Users, Folder,
  ChevronDown, ChevronUp, Home, Store, FileText
} from 'lucide-react';
import { useRoleAuth } from '../../hooks/useRoleAuth';
import { supabase } from '../../utils/supabase';
import {useAuth} from "../../contexts/AuthContext.tsx";

const IconSize = 20;

export default function AgentSidebar({ agentId, activeTab, onTabChange, agentSlug }) {
  const navigate = useNavigate();
  const { role } = useRoleAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedMenus, setExpandedMenus] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const previousActiveTab = useRef(activeTab);
  const {signOut} = useAuth();

  const handleMouseEnter = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    hoverTimeout.current = setTimeout(() => setIsHovered(true), 100);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    hoverTimeout.current = setTimeout(() => setIsHovered(false), 150);
  };

  useEffect(() => {
    if (role && role !== 'agent') navigate('/dashboard');
  }, [role]);

  useEffect(() => {
    if (agentId){
      const fetchUnread = async () => {
        const { count } = await supabase.from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('recipient_id', agentId).eq('is_read', false);
        setUnreadCount(count || 0);
      };
      fetchUnread();

      const channel = supabase.channel('notification_changes')
          .on('postgres_changes', {
            event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${agentId}`
          }, fetchUnread).subscribe();

      return () => {
        supabase.removeChannel(channel);
      }
    }
  }, [agentId]);

  useEffect(() => {
    if (previousActiveTab.current !== activeTab) {
      setExpandedMenus([]);
      previousActiveTab.current = activeTab;
    }
  }, [activeTab]);

  const toggleSubMenu = (menuId) => {
    setExpandedMenus(prev => prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]);
  };

  const handleClick = (id, action, parentId) => async () => {
    try {
      await Promise.resolve(typeof action === 'function' ? action() : action);
      if (parentId) {
        setExpandedMenus(prev => prev.filter(i => i !== parentId));
      }
    } catch (err) {
      console.error('Sidebar click failed:', err);
    }
  };

  const handleLogout = async () => {
    await signOut()
  };

  const createMenuItems = () => [
    {
      id: 'public-profile', label: 'View Public Profile', icon: ExternalLink,
      onClick: () => window.open(`/agent/${agentSlug || agentId}`, '_blank'), external: true
    },
    {
      id: 'edit-profile', label: 'Edit Public Profile', icon: UserCog,
      onClick: () => onTabChange('edit-profile')
    },
    {
      id: 'properties', label: 'Properties', icon: Building2, hasSubmenu: true,
      onClick: () => toggleSubMenu('properties'),
      submenu: [
        { id: 'my-properties', label: 'My Properties', icon: Home, onClick: () => onTabChange('my-properties') },
        { id: 'add-property', label: 'Add Property', icon: Plus, onClick: () => onTabChange('add-property') },
        { id: 'marketplace', label: 'Marketplace', icon: Store, onClick: () => onTabChange('marketplace') },
        { id: 'projects', label: 'Projects', icon: Building, onClick: () => onTabChange('projects') },
      ]
    },
    // {
    //   id: 'notifications', label: 'Notifications', icon: Bell,
    //   onClick: () => onTabChange('notifications'), badge: unreadCount > 0 ? unreadCount : undefined
    // },
    {
      id: 'crm', label: 'CRM', icon: Folder, hasSubmenu: true,
      onClick: () => toggleSubMenu('crm'),
      submenu: [
        { id: 'contacts', label: 'Leads', icon: Users, onClick: () => onTabChange('contacts') },
        { id: 'crm-deals', label: 'Deals', icon: FileText, onClick: () => onTabChange('crm-deals') },
      ]
    },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, onClick: () => onTabChange('jobs') },
    { id: 'statistics', label: 'Statistics', icon: BarChart2, onClick: () => onTabChange('statistics') },
  ];

  const menuItems = createMenuItems();

  return (
      <aside
          className={`fixed left-0 top-0 z-40 h-screen bg-black transition-all duration-300 ease-in-out ${isHovered ? 'w-[250px]' : 'w-[70px]'} flex flex-col`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
      >
        <div className="h-20 flex items-center px-4 border-b border-[#333]">
          <img
              src="https://edcsftvorssaojmyfqgs.supabase.co/storage/v1/object/public/homepage-assets//png%20100%20x%20100%20(1).png"
              alt="AgentVerify"
              className="h-8 w-8"
          />
          {isHovered && <span className="ml-3 text-white text-lg font-semibold">AgentVerify</span>}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 mt-2">
          {menuItems.map(item => {
            const isSubItemActive = item.submenu?.some(sub => sub.id === activeTab);
            const isItemActive = activeTab === item.id || isSubItemActive;

            return (
                <div key={item.id}>
                  <button
                      onClick={handleClick(item.id, item.onClick)}
                      className={`group flex items-center w-full px-3 py-2 rounded-lg mb-1 transition-all duration-200
                  ${isItemActive ? 'bg-[#cefa05] text-black' : 'text-white hover:bg-white/10'} ${isHovered ? 'justify-start' : 'justify-center'} gap-x-3`}
                      aria-expanded={item.hasSubmenu ? expandedMenus.includes(item.id) : undefined}
                      aria-label={item.label}
                  >
                    <div className="min-w-[20px] flex justify-center items-center"><item.icon size={IconSize} /></div>
                    {isHovered && <span className="truncate font-medium text-left">{item.label}</span>}
                    {isHovered && item.hasSubmenu && (
                        expandedMenus.includes(item.id) ? <ChevronUp size={16} className="ml-auto" /> : <ChevronDown size={16} className="ml-auto" />
                    )}
                    {item.badge !== undefined && isHovered && (
                        <span className="ml-auto bg-white text-black text-xs px-2 rounded-full font-medium">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                    )}
                  </button>
                  {item.hasSubmenu && expandedMenus.includes(item.id) && (
                      <div className="ml-6 mt-1 space-y-1 transition-all ease-in-out overflow-hidden">
                        {item.submenu.map(sub => (
                            <button
                                key={sub.id}
                                onClick={handleClick(sub.id, sub.onClick, item.id)}
                                className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 gap-x-3
                        ${activeTab === sub.id ? 'bg-[#cefa05] text-black' : 'text-white/80 hover:bg-white/10'}`}
                                aria-label={sub.label}
                            >
                              <div className="min-w-[20px] flex justify-center items-center"><sub.icon size={IconSize - 4} /></div>
                              <span className="text-left">{sub.label}</span>
                            </button>
                        ))}
                      </div>
                  )}
                </div>
            );
          })}
        </nav>

        <div className="border-t border-[#333333] w-full"></div>
        <div className="px-3 py-4">
          <a
              href="https://wa.me/971543106444"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center w-full px-3 py-2 text-white hover:bg-white/10 rounded-lg mb-2 ${isHovered ? 'justify-start' : 'justify-center'} gap-x-3`}
              aria-label="Support"
          >
            <div className="min-w-[20px] flex justify-center items-center"><HelpCircle size={IconSize} /></div>
            {isHovered && <span className="font-medium text-left">Support</span>}
          </a>
          <button
              onClick={handleClick('logout', handleLogout)}
              className={`flex items-center w-full px-3 py-2 text-white hover:bg-white/10 rounded-lg ${isHovered ? 'justify-start' : 'justify-center'} gap-x-3`}
              aria-label="Logout"
          >
            <div className="min-w-[20px] flex justify-center items-center"><LogOut size={IconSize} /></div>
            {isHovered && <span className="font-medium text-left">Log Out</span>}
          </button>
        </div>
      </aside>
  );
}
