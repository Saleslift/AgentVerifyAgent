import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../utils/i18n';

interface LanguageSelectorMenuProps {
  isAgentProfilePage: boolean;
}

export default function LanguageSelectorMenu({ isAgentProfilePage }: LanguageSelectorMenuProps) {
  const { t } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng); // Save the selected language
    setLanguage(lng);
    setShowDropdown(false);
  };

  // Detect browser or region language on mount
  useEffect(() => {
    const browserLanguage = navigator.language || navigator.userLanguage;
    const detectedLanguage = browserLanguage && browserLanguage.startsWith('fr') ? 'fr' : 'en'; // Default to English if not French
    if (detectedLanguage !== language) {
      handleLanguageChange(detectedLanguage);
    }
  }, []);

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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="text-gray-700 hover:text-gray-900"
        aria-expanded={showDropdown}
        aria-haspopup="true"
      >
        {t('languages')}
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
