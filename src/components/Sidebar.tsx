import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  LogOut,
  HelpCircle
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  onClick: () => void;
  hasSubmenu?: boolean;
  submenu?: SidebarItem[];
  external?: boolean;
}

interface ActionItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  onClick: () => void;
}

interface SidebarProps {
  menuItems: SidebarItem[];
  actionItems?: ActionItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  logoSrc: string;
  appName: string;
}

const IconSize = 20;

export default function Sidebar({
  menuItems,
  actionItems = [],
  activeTab,
  onLogout,
  logoSrc,
  appName
}: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSubMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

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
    hoverTimeout.current = setTimeout(() => {
      setIsHovered(false);
      setExpandedMenus([]); // Collapse all submenus when the cursor leaves the sidebar
    }, 150);
  };

  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-black">
          <div className="flex items-center">
            <img src={logoSrc} alt={appName} className="h-8 w-8" />
            <span className="ml-3 text-white text-lg font-semibold">{appName}</span>
          </div>
          <button onClick={() => setIsFullscreen(true)} className="p-2 text-white">
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Fullscreen Menu */}
        {isFullscreen && (
          <div className="fixed inset-0 bg-black z-50 pt-safe-top pb-safe-bottom overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center">
                <img src={logoSrc} alt={appName} className="h-8 w-8" />
                <span className="ml-3 text-white text-lg font-semibold">{appName}</span>
              </div>
              <button onClick={() => setIsFullscreen(false)} className="p-2 text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Navigation Items */}
              {menuItems.map((item) => (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (item.hasSubmenu) {
                        toggleSubMenu(item.id);
                      } else {
                        item.onClick();
                        setIsFullscreen(false);
                      }
                    }}
                    className={`flex items-center w-full px-4 py-2 rounded-lg ${
                      activeTab === item.id
                        ? 'bg-[#cefa05] text-black'
                        : 'text-white hover:bg-[#333333]'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span>{item.label}</span>
                    {item.hasSubmenu && (
                      expandedMenus.includes(item.id) ? (
                        <ChevronUp className="ml-auto" />
                      ) : (
                        <ChevronDown className="ml-auto" />
                      )
                    )}
                  </button>
                  {item.hasSubmenu && expandedMenus.includes(item.id) && (
                    <div className="ml-6 mt-2 space-y-2">
                      {item.submenu?.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            sub.onClick();
                            setIsFullscreen(false);
                          }}
                          className={`flex items-center w-full px-4 py-2 rounded-lg ${
                            activeTab === sub.id
                              ? 'bg-[#cefa05] text-black'
                              : 'text-white hover:bg-[#333333]'
                          }`}
                        >
                          <sub.icon className="h-4 w-4 mr-3" />
                          <span>{sub.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Divider */}
              <div className="border-t border-[#333333] my-3"></div>

              {/* Action Items */}
              {actionItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    item.onClick();
                    setIsFullscreen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 rounded-lg bg-[#cefa05] text-black hover:bg-opacity-90 mb-2"
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span>{item.label}</span>
                </button>
              ))}

              {/* Support and Logout */}
              <div className="pt-4 border-t border-[#333333]">
                <a
                  href="https://wa.me/971543106444"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center w-full px-4 py-2 text-white hover:bg-[#333333] rounded-lg mb-2"
                >
                  <HelpCircle className="h-5 w-5 mr-3" />
                  <span>Support</span>
                </a>
                <button
                  onClick={onLogout}
                  className="flex items-center w-full px-4 py-2 text-white hover:bg-[#333333] rounded-lg"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-black transition-all duration-300 ease-in-out ${
        isHovered ? 'w-[250px]' : 'w-[70px]'
      } flex flex-col`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="h-20 flex items-center px-4 border-b border-[#333]">
        <img src={logoSrc} alt={appName} className="h-8 w-8" />
        {isHovered && <span className="ml-3 text-white text-lg font-semibold">{appName}</span>}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 mt-2">
        <ul>
          {/* Menu Items */}
          {menuItems.map((item) => {
            const isSubItemActive = item.submenu?.some((sub) => sub.id === activeTab);
            const isItemActive = activeTab === item.id || isSubItemActive;

            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    item.onClick();
                    if (item.hasSubmenu) toggleSubMenu(item.id);
                  }}
                  className={`group flex items-center w-full px-3 py-2 rounded-lg mb-1 transition-all duration-200
                    ${isItemActive ? 'bg-[#cefa05] text-black' : 'text-white hover:bg-white/10'} ${
                    isHovered ? 'justify-start' : 'justify-center'
                  } gap-x-3`}
                >
                  <item.icon size={IconSize} />
                  {isHovered && <span className="truncate">{item.label}</span>}
                  {item.hasSubmenu && isHovered && (
                    expandedMenus.includes(item.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </button>
                {item.hasSubmenu && expandedMenus.includes(item.id) && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.submenu?.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={sub.onClick}
                        className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition-all duration-200
                          ${activeTab === sub.id ? 'bg-[#cefa05] text-black' : 'text-white/80 hover:bg-white/10'}`}
                      >
                        <sub.icon size={IconSize - 4} />
                        <span className={'ml-1'}>{sub.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}

          {/* Divider before action items */}
          {actionItems.length > 0 && (
            <li>
              <div className="my-3 border-t border-[#333333] w-full"></div>
            </li>
          )}

          {/* Action Items */}
          {actionItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={item.onClick}
                className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium bg-[#cefa05] text-black hover:bg-opacity-90 mb-2 
                  ${!isHovered ? 'justify-center' : ''}`}
              >
                <item.icon className="h-5 w-5" />
                {isHovered && (
                  <span className="ml-3 truncate font-medium">
                    {item.label}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-[#333333] w-full"></div>
      <div className="px-3 py-4">
        <a
          href="https://wa.me/971543106444"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center w-full px-3 py-2 text-white hover:bg-white/10 rounded-lg mb-2 ${
            isHovered ? 'justify-start' : 'justify-center'
          } gap-x-3`}
        >
          <HelpCircle size={IconSize} />
          {isHovered && <span>Support</span>}
        </a>
        <button
          onClick={onLogout}
          className={`flex items-center w-full px-3 py-2 text-white hover:bg-white/10 rounded-lg ${
            isHovered ? 'justify-start' : 'justify-center'
          } gap-x-3`}
        >
          <LogOut size={IconSize} />
          {isHovered && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}

