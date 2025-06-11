import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu } from 'lucide-react';
import ConnectModal from './agent/ConnectModal';
import ContactOptions from './ContactOptions';
import LanguageSelectorMenu from './LanguageSelectorMenu';
import type {Agent} from "../types";

type HeaderProps = {
  agent?: Agent;
}

export default function Header({agent}: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if we're on an agent profile page
  const isAgentProfilePage = location.pathname.startsWith('/agent/');

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDashboardClick = () => {
    // Set flag to allow navigation
    sessionStorage.setItem('intentional_navigation', 'true');
    navigate('/dashboard');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm z-[20] border-b border-gray-100 relative">
      {/* Increased z-index and added relative positioning */}
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div>
          <a href="/" className="flex items-center space-x-3">
            <div className="relative w-10 h-10">
              <img
                src="https://edcsftvorssaojmyfqgs.supabase.co/storage/v1/object/public/homepage-assets//png%20100%20x%20100%20(1).png"
                alt="AgentVerify Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-bold text-black">AgentVerify</span>
          </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            {isAgentProfilePage && agent ? (
                <div className={'flex items-center justify-center'}>
                  <ContactOptions
                      whatsapp={agent.whatsapp}
                      email={agent.email}
                      phone={agent.phone}
                  />
                  <div className={'ml-1'}>
                  <LanguageSelectorMenu isAgentProfilePage={isAgentProfilePage}  />
                  </div>
                </div>
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-3">
            {isAgentProfilePage && agent ? (
                <>
                  <ContactOptions
                      whatsapp={agent.whatsapp}
                      email={agent.email}
                      phone={agent.phone}
                  />
                  <LanguageSelectorMenu isAgentProfilePage={isAgentProfilePage}  />

                </>
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="text-gray-700 hover:text-gray-900"
                  aria-expanded={showDropdown}
                  aria-haspopup="true"
                >
                  Menu
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-[110] border border-gray-100">
                    <button
                      onClick={handleDashboardClick}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/signin')}
                className="px-6 py-2.5 rounded-full bg-white text-black border border-brand-lime hover:border-brand-yellow transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-gray-100">
            {!isAgentProfilePage && user ? (
              <div className="flex flex-col space-y-4">
                <button
                  onClick={handleDashboardClick}
                  className="text-gray-700 hover:text-gray-900"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleSignOut}
                  className="text-left text-gray-700 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </div>
            ) : !isAgentProfilePage && (
              <button
                onClick={() => navigate('/signin')}
                className="w-full px-6 py-2.5 bg-white text-black border border-brand-lime hover:border-brand-yellow rounded-full"
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Connect Modal */}
      {isAgentProfilePage && showConnectModal && agent && (
        <ConnectModal
          isOpen={showConnectModal}
          onClose={() => setShowConnectModal(false)}
          agent={agent}
        />
      )}
    </header>
  );
}
