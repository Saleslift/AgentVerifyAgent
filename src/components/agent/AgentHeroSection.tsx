import React, { useState } from 'react';
import { FileText, Star, Building2, MapPin, Clock, Home, Package, MessageSquare } from 'lucide-react';
import { Agent } from '../../types';
import ConnectModal from './ConnectModal';
import BrokerCertificateModal from './BrokerCertificateModal';

interface AgentHeroSectionProps {
  agent: Agent;
  averageRating: number;
}

export default function AgentHeroSection({ agent, averageRating }: AgentHeroSectionProps) {
  // State for modals
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  
  // Extract specialties for tags
  const specialtyTags = agent.specialties?.slice(0, 3) || [];
  
  // Check if agent has RERA certificate
  const hasReraCertificate = agent.certifications?.some(cert => cert.is_rera);
  
  return (
    <section className="relative bg-white overflow-hidden pt-0 md:pt-0">
      <div className="container mx-auto px-4">
        {/* Mobile layout - stacked */}
        <div className="flex flex-col lg:hidden gap-6 py-6">
          {/* Info Section for Mobile */}
          <div className="flex flex-col justify-center bg-gray-50 p-6 rounded-3xl h-full min-h-[400px]">
            {/* Broker Certificate Badge - Only show if RERA certificate exists */}
            {hasReraCertificate && (
              <button 
                className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-shadow self-start mb-4"
                onClick={() => setShowCertificateModal(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Broker Certificate #{agent.registrationNumber || 'N/A'}</span>
              </button>
            )}
            
            {/* Main Heading */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight tracking-tighter mb-4">
              I am {agent.name}, your real estate agent in {agent.location || 'Dubai'}.
            </h1>
            
            {/* Tags with Icons - Wrapped on mobile */}
            <div className="flex flex-wrap items-center gap-3">
              {specialtyTags.map((specialty, index) => (
                <span key={index} className="inline-flex items-center px-3 py-1.5 bg-black text-white rounded-full text-sm whitespace-nowrap">
                  <Package className="h-4 w-4 mr-1.5" />
                  {specialty}
                </span>
              ))}
              <span className="inline-flex items-center px-3 py-1.5 bg-black text-white rounded-full text-sm whitespace-nowrap">
                <MapPin className="h-4 w-4 mr-1.5" />
                {agent.location || 'Dubai'}
              </span>
              <span className="inline-flex items-center px-3 py-1.5 bg-black text-white rounded-full text-sm whitespace-nowrap">
                <Clock className="h-4 w-4 mr-1.5" />
                {agent.experience || '5+ years'}
              </span>
              <span className="inline-flex items-center px-3 py-1.5 bg-black text-white rounded-full text-sm whitespace-nowrap">
                <Home className="h-4 w-4 mr-1.5" />
                {agent.activeListings || 0} properties
              </span>
            </div>
            
            {/* Languages Section */}
            <div className="text-gray-600 mt-4">
              <span className="font-medium">Languages:</span>{' '}
              {agent.languages?.join(', ') || 'English'}
            </div>
          </div>

          {/* Profile Image for Mobile - Full width */}
          <div className="w-full">
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden mx-auto h-full min-h-[400px]">
              <img
                src={agent.photo || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&h=500&fit=crop'}
                alt={agent.name}
                className="w-full h-full object-cover"
                loading="eager"
              />
              {agent.reviews && agent.reviews.length > 0 && (
                <div className="absolute bottom-4 left-4 flex items-center bg-white bg-opacity-95 backdrop-blur-sm px-4 py-3 rounded-xl">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, index) => (
                      <Star
                        key={index}
                        className={`h-4 w-4 ${
                          index < Math.floor(averageRating)
                            ? 'text-[#cefa05] fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 font-semibold text-gray-900 text-sm">
                    {averageRating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop layout - grid */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6 items-stretch py-8">
          {/* Left Column - 2/3 width on desktop */}
          <div className="lg:col-span-2 flex flex-col justify-center bg-gray-50 p-8 rounded-3xl h-full min-h-[450px]">
            <div className="flex flex-col justify-center h-full space-y-6">
              {/* Broker Certificate Badge - Only show if RERA certificate exists */}
              {hasReraCertificate && (
                <button 
                  className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-shadow self-start"
                  onClick={() => setShowCertificateModal(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Broker Certificate #{agent.registrationNumber || 'N/A'}</span>
                </button>
              )}
              
              {/* Main Heading */}
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight tracking-tighter">
                I am {agent.name}, your real estate agent in {agent.location || 'Dubai'}.
              </h1>
              
              {/* Tags with Icons */}
              <div className="flex flex-wrap items-center gap-3">
                {specialtyTags.map((specialty, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1.5 bg-black text-white rounded-full text-sm whitespace-nowrap"
                  >
                    <Package className="h-4 w-4 mr-1.5" />
                    {specialty}
                  </span>
                ))}
                <span className="inline-flex items-center px-3 py-1.5 bg-black text-white rounded-full text-sm whitespace-nowrap">
                  <MapPin className="h-4 w-4 mr-1.5" />
                  {agent.location || 'Dubai'}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 bg-black text-white rounded-full text-sm whitespace-nowrap">
                  <Clock className="h-4 w-4 mr-1.5" />
                  {agent.experience || '5+ years'}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 bg-black text-white rounded-full text-sm whitespace-nowrap">
                  <Home className="h-4 w-4 mr-1.5" />
                  {agent.activeListings || 0} properties
                </span>
              </div>
              
              {/* Languages Section */}
              <div className="text-gray-600">
                <span className="font-medium">Languages:</span>{' '}
                {agent.languages?.join(', ') || 'English'}
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 width on desktop */}
          <div className="relative h-full flex items-center">
            <div className="w-full aspect-square rounded-2xl overflow-hidden mx-auto h-full min-h-[450px]">
              <img
                src={agent.photo || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&h=500&fit=crop'}
                alt={agent.name}
                className="w-full h-full object-cover"
                loading="eager"
              />
              {agent.reviews && agent.reviews.length > 0 && (
                <div className="absolute bottom-4 left-4 flex items-center bg-white bg-opacity-95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, index) => (
                      <Star
                        key={index}
                        className={`h-5 w-5 ${
                          index < Math.floor(averageRating)
                            ? 'text-[#cefa05] fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 font-semibold text-gray-900">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="ml-2 text-gray-500">
                    ({agent.reviews.length} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Connect Modal */}
      <ConnectModal 
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        agent={agent}
      />

      {/* Broker Certificate Modal - Only render if RERA certificate exists */}
      {hasReraCertificate && (
        <BrokerCertificateModal
          isOpen={showCertificateModal}
          onClose={() => setShowCertificateModal(false)}
          agent={agent}
        />
      )}
    </section>
  );
}