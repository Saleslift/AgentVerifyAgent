import React from 'react';
import { Copy, MessageSquare, Mail, X } from 'lucide-react';
import { Property } from '../../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  onCopySuccess?: () => void;
}

export default function ShareModal({
  isOpen,
  onClose,
  property,
  onCopySuccess
}: ShareModalProps) {
  if (!isOpen) return null;

  const pageUrl = property.hasOwnProperty('projectId') ?
      `${window.location.origin}/property/${property.projectId}/unit-types/${property.id}`
      :`${window.location.origin}/property/${property.slug || property.id}`;


  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      onCopySuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleWhatsAppShare = () => {
    const text = `Check out this property: ${property.title} - ${pageUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    onClose();
  };

  const handleEmailShare = () => {
    const subject = `Property Listing: ${property.title}`;
    const body = `Check out this property:\n\n${property.title}\n${pageUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 animate-fade-in-up">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Share Property</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleCopyLink}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center">
              <Copy className="h-5 w-5 mr-3 text-gray-500" />
              <span>Copy Link</span>
            </div>
            <span className="text-sm text-gray-500">→</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="w-full px-4 py-3 flex items-center justify-between bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <div className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-3 text-green-600" />
              <span>Share on WhatsApp</span>
            </div>
            <span className="text-sm text-gray-500">→</span>
          </button>

          <button
            onClick={handleEmailShare}
            className="w-full px-4 py-3 flex items-center justify-between bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <div className="flex items-center">
              <Mail className="h-5 w-5 mr-3 text-blue-600" />
              <span>Share via Email</span>
            </div>
            <span className="text-sm text-gray-500">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
