import React, { useState } from 'react';
import { MessageSquare, Phone, Mail } from 'lucide-react';
import Modal from './Modal';
import { useTranslation } from 'react-i18next'; // Import translation hook

interface ContactOptionsProps {
  whatsapp?: string;
  email?: string;
  phone?: string;
}

export default function ContactOptions({ whatsapp, email, phone }: ContactOptionsProps) {
  const [showModal, setShowModal] = useState(false);
  const { t } = useTranslation(); // Initialize translation hook

  const handleWhatsAppClick = () => {
    if (whatsapp) {
      window.open(`https://wa.me/${whatsapp.replace(/\+/g, '')}`, '_blank');
    }
  };

  const handleCallClick = () => {
    if (phone || whatsapp) {
      window.location.href = `tel:${phone || whatsapp}`;
    }
  };

  const handleEmailClick = () => {
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <>
      {/* Desktop View */}
      <div className="hidden lg:flex items-center space-x-3">
        <button
          onClick={handleWhatsAppClick}
          disabled={!whatsapp}
          className="inline-flex items-center px-3 py-2 bg-[#cefa05] text-black rounded-lg hover:bg-[#b9e500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={t('contactWhatsApp')}
        >
          <MessageSquare className="h-5 w-5 mr-2" />
          <span>{t('whatsapp')}</span>
        </button>
        <button
          onClick={handleCallClick}
          disabled={!phone && !whatsapp}
          className="inline-flex items-center px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={t('contactCall')}
        >
          <Phone className="h-5 w-5 mr-2" />
          <span>{t('call')}</span>
        </button>
        <button
          onClick={handleEmailClick}
          disabled={!email}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={t('contactEmail')}
        >
          <Mail className="h-5 w-5 mr-2" />
          <span>{t('email')}</span>
        </button>
      </div>

      {/* Mobile View */}
      <button
        onClick={() => setShowModal(true)}
        className="lg:hidden inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
        aria-label={t('connectWithMe')}
      >
        <MessageSquare className="h-5 w-5" />
        {/*{t('connectWithMe')}*/}
      </button>

      {/* Modal for Mobile */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={t('letsConnect')}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <button
              onClick={handleWhatsAppClick}
              disabled={!whatsapp}
              className="flex items-center justify-center w-full px-4 py-3 bg-[#cefa05] text-black rounded-lg hover:bg-[#b9e500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('contactWhatsApp')}
            >
              <MessageSquare className="h-5 w-5 mr-3" />
              {t('whatsapp')}
            </button>

            <button
              onClick={handleCallClick}
              disabled={!phone && !whatsapp}
              className="flex items-center justify-center w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('contactCall')}
            >
              <Phone className="h-5 w-5 mr-3" />
              {t('call')}
            </button>

            <button
              onClick={handleEmailClick}
              disabled={!email}
              className="flex items-center justify-center w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('contactEmail')}
            >
              <Mail className="h-5 w-5 mr-3" />
              {t('email')}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
