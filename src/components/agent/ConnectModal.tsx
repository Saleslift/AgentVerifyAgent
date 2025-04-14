import React, { useEffect, useRef } from 'react';
import { X, MessageSquare, Phone, Mail } from 'lucide-react';
import { Agent } from '../../types';
import Modal from '../Modal';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent;
}

export default function ConnectModal({ isOpen, onClose, agent }: ConnectModalProps) {
  // Format email address
  const emailAddress = agent.agencyEmail || 
    `${agent.name.toLowerCase().replace(/\s+/g, '.')}@${agent.agencyName.toLowerCase().replace(/\s+/g, '')}.com`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Let's Connect"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <a
          href={`https://wa.me/${agent.whatsapp?.replace(/\+/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full px-4 py-3 bg-[#cefa05] text-black rounded-lg hover:bg-[#b9e500] transition-colors"
          onClick={onClose}
          aria-label="Contact via WhatsApp"
        >
          <MessageSquare className="h-5 w-5 mr-3" />
          WhatsApp
        </a>
        
        <a
          href={`tel:${agent.whatsapp}`}
          className="flex items-center justify-center w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
          onClick={onClose}
          aria-label="Call agent"
        >
          <Phone className="h-5 w-5 mr-3" />
          Call
        </a>
        
        <a
          href={`mailto:${emailAddress}`}
          className="flex items-center justify-center w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          onClick={onClose}
          aria-label="Email agent"
        >
          <Mail className="h-5 w-5 mr-3" />
          Email
        </a>
      </div>
    </Modal>
  );
}