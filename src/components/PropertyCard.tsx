import React, { useState, memo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, Plus, Trash2, Edit } from 'lucide-react';
import { Property } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
// Lazy load the ShareModal component
const ShareModal = React.lazy(() => import('./property/ShareModal'));
import OptimizedImage from './OptimizedImage';
import { supabase } from '../utils/supabase';

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
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [allAmenities, setAllAmenities] = useState<string[]>([]);

  // Fetch all amenities including custom ones
  useEffect(() => {
    const fetchAllAmenities = async () => {
      try {
        const { data, error } = await supabase.rpc(
          'get_all_property_amenities',
          { p_property_id: property.id }
        );

        if (error) throw error;

        if (data) {
          const amenityNames = data.map(item => item.name);
          setAllAmenities(amenityNames);
        }
      } catch (err) {
        console.error('Error fetching amenities:', err);
        // Fallback to standard amenities if custom fetch fails
        setAllAmenities(property.amenities || []);
      }
    };

    fetchAllAmenities();
  }, [property.id, property.amenities]);

  // Handle click outside share menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareOptions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Prevent navigation if clicking action buttons
    if (e.target instanceof HTMLElement &&
        (e.target.closest('button') || e.target.closest('a'))
    ) {
      return;
    }

    // Set flag to allow navigation
    sessionStorage.setItem('intentional_navigation', 'true');
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
            {source === 'direct' ? 'My Property' : 'Marketplace'}
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
                  Add
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
                      Edit
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
                      Delete
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
                  Remove
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
          Link copied!
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
