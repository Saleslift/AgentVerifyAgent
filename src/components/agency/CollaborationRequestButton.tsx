import React, { useState } from 'react';
import { HeartHandshake as Handshake } from 'lucide-react';
import CollaborationRequestModal from './CollaborationRequestModal';

interface CollaborationRequestButtonProps {
  developerId: string;
  developerName: string;
  projectId?: string;
  projectName?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onSuccess?: () => void;
}

export default function CollaborationRequestButton({
  developerId,
  developerName,
  projectId,
  projectName,
  variant = 'primary',
  size = 'md',
  className = '',
  onSuccess
}: CollaborationRequestButtonProps) {
  const [showModal, setShowModal] = useState(false);

  // Style variants
  const variantStyles = {
    primary: 'bg-black text-white hover:bg-gray-900',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  };

  // Size variants
  const sizeStyles = {
    sm: 'text-sm px-2.5 py-1.5',
    md: 'px-4 py-2',
    lg: 'text-lg px-5 py-2.5',
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center rounded-lg transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      >
        <Handshake className="h-5 w-5 mr-2" />
        Request Collaboration
      </button>

      {showModal && (
        <CollaborationRequestModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          developerId={developerId}
          developerName={developerName}
          projectId={projectId}
          projectName={projectName}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
}