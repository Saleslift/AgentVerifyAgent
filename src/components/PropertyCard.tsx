import React, { useState, memo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, Plus, Trash2, Edit } from 'lucide-react';
import { Property } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTranslation } from 'react-i18next'; // Added
// Lazy load the ShareModal component
const ShareModal = React.lazy(() => import('./property/ShareModal'));
import OptimizedImage from './OptimizedImage';

interface PropertyCardProps {
  property: Property;
  source?: 'direct' | 'marketplace';
  onAddToListings?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  loading?: boolean;
  showOriginTag?: boolean;
}

const PropertyCard = memo(function PropertyCard({
  property,
  source = 'direct',
  onAddToListings,
  onEdit,
  onDelete,
  loading = false,
  showOriginTag = false
}: PropertyCardProps) {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { t } = useTranslation(); // Added
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);


  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Prevent navigation if clicking action buttons
    if (e.target instanceof HTMLElement &&
        (e.target.closest('button') || e.target.closest('a'))
    ) {
      return;
    }
    sessionStorage.setItem('intentional_navigation', 'true');

    if (property.hasOwnProperty('projectId')) {
      // If the property is from the agent_properties table, navigate to the property page
      window.open(`/property/${property.projectId}/unit-types/${property.id}`, '_blank');
      return;

    }

    // Set flag to allow navigation
    navigate(`/property/${property.slug || property.id}`);
  }, [navigate, property.id, property.slug]);

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShareModal(true);
  }, []);

  const handleAddToListings = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToListings?.();
  }, [onAddToListings]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.();
  }, [onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.();
  }, [onDelete]);

  const handleCopySuccess = useCallback(() => {
    setShowCopiedMessage(true);
    setTimeout(() => setShowCopiedMessage(false), 2000);
  }, []);

  return (
    <>
      <div
        ref={cardRef}
        className="relative bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer transform transition-all duration-300"
        onClick={handleCardClick}
      >
        {/* Origin Tag - Only show if explicitly requested */}
        {showOriginTag && source && (
          <div className={`absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-xs font-medium ${
            source === 'direct' 
              ? 'bg-black text-white' 
              : 'bg-[#cefa05] text-black'
          }`}>
            {source === 'direct' ? t('myProperty') : t('marketplace')}
          </div>
        )}

        <div className="relative aspect-[4/3]">
          <OptimizedImage
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full"
            priority={false}
          />
        </div>

        <div className="p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 h-12">{property.title}</h3>

          <div className="flex flex-wrap gap-2 mb-3 text-sm">
            <div className="flex items-center px-2 py-1 bg-gray-100 rounded-md">
              <span>{t(property.type)}</span>
            </div>
            {property.bedrooms !== undefined && (
              <div className="flex items-center px-2 py-1 bg-gray-100 rounded-md">
                <span>{property.bedrooms} {t('bed')}</span>
              </div>
            )}
            {property.bathrooms !== undefined && (
              <div className="flex items-center px-2 py-1 bg-gray-100 rounded-md">
                <span>{property.bathrooms} {t('bath')}</span>
              </div>
            )}
            {property.sqft !== undefined && (
              <div className="flex items-center px-2 py-1 bg-gray-100 rounded-md">
                <span>{property.sqft} {t('sqft')}</span>
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

              {/* Action Buttons */}
              {source === 'marketplace' && onAddToListings && (
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
                  {t('add')}
                </button>
              )}

              {source === 'direct' && (
                <div className="flex space-x-2">
                  {onEdit && (
                    <button
                      onClick={handleEdit}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 text-sm"
                    >
                      {loading ? (
                        <span className="animate-spin mr-2">⌛</span>
                      ) : (
                        <Edit className="h-4 w-4 mr-1" />
                      )}
                      {t('edit')}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                    >
                      {loading ? (
                        <span className="animate-spin mr-2">⌛</span>
                      ) : (
                        <Trash2 className="h-4 w-4 mr-1" />
                      )}
                      {t('delete')}
                    </button>
                  )}
                </div>
              )}

              {source === 'marketplace' && onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                >
                  {loading ? (
                    <span className="animate-spin mr-2">⌛</span>
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1" />
                  )}
                  {t('remove')}
                </button>
              )}
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
          {t('linkCopied')}
        </div>
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.property.id === nextProps.property.id &&
    prevProps.property.price === nextProps.property.price &&
    prevProps.property.title === nextProps.property.title &&
    prevProps.loading === nextProps.loading &&
    prevProps.showOriginTag === nextProps.showOriginTag
  );
});

export default PropertyCard;

