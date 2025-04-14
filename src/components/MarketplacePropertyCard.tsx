import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, Plus } from 'lucide-react';
import { Property } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import ShareModal from './property/ShareModal';

interface MarketplacePropertyCardProps {
  property: Property;
  onAddToListings: () => void;
  loading?: boolean;
}

export default function MarketplacePropertyCard({
  property,
  onAddToListings,
  loading = false
}: MarketplacePropertyCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking action buttons
    if (e.target instanceof HTMLElement && 
        (e.target.closest('button') || e.target.closest('a'))
    ) {
      return;
    }
    
    // Set flag to allow navigation
    sessionStorage.setItem('intentional_navigation', 'true');
    navigate(`/property/${property.slug || property.id}`);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShareModal(true);
  };

  const handleAddToListings = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToListings();
  };

  const handleCopySuccess = () => {
    setShowCopiedMessage(true);
    setTimeout(() => setShowCopiedMessage(false), 2000);
  };

  return (
    <>
      <div 
        className="relative bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer transform transition-all duration-300"
        onClick={handleCardClick}
      >
        {/* Marketplace Tag */}
        <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-xs font-medium bg-[#cefa05] text-black">
          Marketplace
        </div>

        <div className="relative aspect-[4/3]">
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 h-12">{property.title}</h3>
          
          <div className="flex flex-wrap gap-2 mb-3 text-sm">
            <div className="flex items-center px-2 py-1 bg-gray-100 rounded-md">
              <span>{property.type}</span>
            </div>
            {property.bedrooms !== undefined && (
              <div className="flex items-center px-2 py-1 bg-gray-100 rounded-md">
                <span>{property.bedrooms} bed</span>
              </div>
            )}
            {property.bathrooms !== undefined && (
              <div className="flex items-center px-2 py-1 bg-gray-100 rounded-md">
                <span>{property.bathrooms} bath</span>
              </div>
            )}
            {property.sqft !== undefined && (
              <div className="flex items-center px-2 py-1 bg-gray-100 rounded-md">
                <span>{property.sqft} sqft</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center mb-3">
            <span className="text-gray-600 text-sm truncate">{property.location}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary-300">
              {formatPrice(property.price)}
            </span>
            
            <div className="flex items-center space-x-2">
              {/* Share Button */}
              <button
                onClick={handleShare}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Share2 className="h-5 w-5" />
              </button>

              {/* Add to Listings Button */}
              <button
                onClick={handleAddToListings}
                disabled={loading}
                className="inline-flex items-center px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? (
                  <span className="animate-spin mr-2">⌛</span>
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        property={property}
        onCopySuccess={handleCopySuccess}
      />

      {/* Copied Message */}
      {showCopiedMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg text-sm animate-fade-in z-50">
          Link copied!
        </div>
      )}
    </>
  );
}