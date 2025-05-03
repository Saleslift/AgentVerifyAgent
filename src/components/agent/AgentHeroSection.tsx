import React, { useState } from 'react';
import { FileText, Star, MapPin, Clock, Home, Package } from 'lucide-react';
import { Agent } from '../../types';
import ConnectModal from './ConnectModal';
import BrokerCertificateModal from './BrokerCertificateModal';
import AgentMediaDisplay from './AgentMediaDisplay';
import { useTranslation } from 'react-i18next'; // Added

interface AgentHeroSectionProps {
  agent: Agent;
  averageRating: number;
}

export default function AgentHeroSection({ agent, averageRating }: AgentHeroSectionProps) {
  const { t } = useTranslation(); // Added

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
                <span className="text-sm font-medium">
                  {t('brokerCertificate')} #{agent.registrationNumber || t('notAvailable')}
                </span>
              </button>
            )}

            {/* Main Heading */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight tracking-tighter mb-4">
              {t('agentIntroduction', { name: agent.name, location: agent.location || t('defaultLocation') })}
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
                {agent.location || t('defaultLocation')}
              </span>
              <span className="inline-flex items-center px-3 py-1.5 bg-black text-white rounded-full text-sm whitespace-nowrap">
                <Clock className="h-4 w-4 mr-1.5" />
                {agent.experience || t('defaultExperience')}
              </span>
              <span className="inline-flex items-center px-3 py-1.5 bg-black text-white rounded-full text-sm whitespace-nowrap">
                <Home className="h-4 w-4 mr-1.5" />
                {t('property_count', { count: agent.activeListings })}
              </span>
            </div>

            {/* Languages Section */}
            <div className="text-gray-600 mt-4">
              <span className="font-medium">{t('languages')}:</span>{' '}
              {agent.languages?.join(', ') || t('defaultLanguage')}
            </div>
          </div>

          {/* Media Display for Mobile */}
          <div className="w-full">
            <AgentMediaDisplay
              videoUrl={agent.promotionVideoUrl}
              imageUrl={agent.photo || t('defaultPhoto')}
              altText={agent.name}
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
                  <span className="text-sm font-medium">
                    {t('brokerCertificate')} #{agent.registrationNumber || t('notAvailable')}
                  </span>
                </button>
              )}

              {/* Main Heading */}
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight tracking-tighter">
                {t('agentIntroduction', { name: agent.name, location: agent.location || t('defaultLocation') })}
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
                  {agent.location || t('defaultLocation')}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 bg-black text-white rounded-full text-sm whitespace-nowrap">
                  <Clock className="h-4 w-4 mr-1.5" />
                  {agent.experience || t('defaultExperience')}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 bg-black text-white rounded-full text-sm whitespace-nowrap">
                  <Home className="h-4 w-4 mr-1.5" />
                  {t('property_count', { count: agent.activeListings })}
                </span>
              </div>

              {/* Languages Section */}
              <div className="text-gray-600">
                <span className="font-medium">{t('languages')}:</span>{' '}
                {agent.languages?.join(', ') || t('defaultLanguage')}
              </div>
            </div>
          </div>

          {/* Media Display for Desktop */}
          <div className="relative h-full flex items-center">
            <AgentMediaDisplay
              videoUrl={agent.promotionVideoUrl}
              imageUrl={agent.photo || t('defaultPhoto')}
              altText={agent.name}
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
                  ({t('reviewsCount', { count: agent.reviews.length })})
                </span>
              </div>
            )}
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
