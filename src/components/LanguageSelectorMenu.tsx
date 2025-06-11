import React, { useState, useRef, useEffect } from 'react';
import {Globe} from "lucide-react";
import { useNavigate, useParams } from 'react-router-dom';

import i18n from '../utils/i18n';

interface LanguageSelectorMenuProps {
  isAgentProfilePage: boolean;
}

export default function LanguageSelectorMenu({ isAgentProfilePage }: LanguageSelectorMenuProps) {
  const { slug, lang } = useParams(); // Get current slug and language from URL
  const navigate = useNavigate();
  const [language, setLanguage] = useState(lang || 'en'); // Default to English
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    setLanguage(lng);
    setShowDropdown(false);

    // Update the URL with the selected language
    if (isAgentProfilePage && slug) {
      navigate(`/agent/${slug}/${lng}`, { replace: true });
    }
  };

  // Detect browser or region language on mount
  useEffect(() => {
    if (!lang) {
      const browserLanguage = navigator.language || navigator.userLanguage;
      const detectedLanguage = browserLanguage && browserLanguage.startsWith('fr') ? 'fr' : 'en';
      handleLanguageChange(detectedLanguage);
    }
  }, [lang]);

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

  if (!isAgentProfilePage) return null;

  return (
    <div className="relative flex justify-center items-center" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="text-gray-700 hover:text-gray-900"
        aria-expanded={showDropdown}
        aria-h
      >
        <div className="relative">
          <span className="absolute top-1 right-1 bg-white rounded-full text-xs px-0.5 py-0.5 z-10 translate-x-1/2 -translate-y-1/2">
            {language.toUpperCase()}
          </span>
          <Globe size={35} />
        </div>
      </button>


      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-[1000] border border-gray-100">
          <button
            onClick={() => handleLanguageChange('en')}
            className={`block w-full text-left px-4 py-2 ${
              language === 'en' ? 'bg-gray-100 text-black' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            English
          </button>
          <button
            onClick={() => handleLanguageChange('fr')}
            className={`block w-full text-left px-4 py-2 ${
              language === 'fr' ? 'bg-gray-100 text-black' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Français
          </button>
        </div>
      )}
    </div>
  );
}
