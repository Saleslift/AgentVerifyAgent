import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Share2 } from 'lucide-react';
import NearbyPlaces from '../components/property/NearbyPlaces';
import PropertyDetails from '../components/property/PropertyDetails';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Property } from '../types';
import { supabase } from '../utils/supabase';
import { useCurrency } from '../contexts/CurrencyContext';
import { initPageVisibilityHandling, cleanupPageVisibilityHandling } from '../utils/pageVisibility';
import ShareModal from '../components/property/ShareModal';
import FullscreenGallery from '../components/property/FullscreenGallery';
import MainImageGallery from '../components/property/MainImageGallery';
import PriceCard from '../components/property/PriceCard';
import PropertyMap from "../components/PropertyMap.tsx";

type PropertyPageProps = {
    slug?: string;
    withNearByPlaces?: boolean;
}
export default function PropertyPage(props: PropertyPageProps) {
  const { slug: propsSlug, withNearByPlaces = true } = props;
  const { slug: routeSlug } = useParams();
  const slug = propsSlug || routeSlug;
  const isDedicatedPage = !propsSlug;
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);

  // Initialize page visibility handling to prevent reloads
  useEffect(() => {
    initPageVisibilityHandling();
    return () => cleanupPageVisibilityHandling();
  }, []);

  useEffect(() => {
    fetchProperty();
  }, [slug]);

  const fetchProperty = async () => {
    try {
      if (!slug) return;

      const { data, error: fetchError } = await supabase
        .from('properties')
        .select(`
          *,
          agent:agent_id(
            full_name,
            avatar_url,
            agency_name,
            whatsapp,
            email
          )
        `)
        .eq('slug', slug)
        .single();

      if (fetchError) throw fetchError;

      // Transform the data to match Property type
      const transformedData: Property = {
        ...data,
        contractType: data.contract_type,
        furnishingStatus: data.furnishing_status,
        completionStatus: data.completion_status,
        floorPlanImage: data.floor_plan_image,
        parkingAvailable: data.parking_available || false,
        agentId: data.agent_id
      };

      setProperty(transformedData);
    } catch (err) {
      console.error('Error fetching property:', err);
      setError('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevImage = () => {
    if (!property) return;
    setActiveImageIndex((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!property) return;
    setActiveImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleShare = () => {
    if (!property) return;
    setShowShareModal(true);
  };

  const handleCopySuccess = () => {
    setShowCopiedMessage(true);
    setTimeout(() => setShowCopiedMessage(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error || 'Property not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isDedicatedPage && <Header />}

      <main className="pt-20 bg-white" id={'property-main-page'}>
        <div className="container mx-auto px-4 py-6">
          {/* Price and Address Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2" data-html2pdf-ignore>
              <h2 className="text-3xl font-bold text-black">
                {formatPrice(property.price)}
              </h2>
              <button
                  onClick={handleShare}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Share2 className="h-6 w-6" />
              </button>
            </div>
            <p className="text-gray-700 text-lg mb-2">{property.location}</p>
            <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
          </div>

          {/* Main Image with Gallery */}
          <MainImageGallery
            images={property.images}
            activeImageIndex={activeImageIndex}
            onSetActiveImageIndex={setActiveImageIndex}
            onShowGallery={() => setShowGallery(true)}
            onPrevImage={handlePrevImage}
            onNextImage={handleNextImage}
          />

          {/* Fullscreen Gallery */}
          {showGallery && (
            <FullscreenGallery
              images={property.images}
              initialIndex={activeImageIndex}
              onClose={() => setShowGallery(false)}
            />
          )}

          {/* Mobile Property Details - Shown at the top on mobile */}
          <div className="md:hidden mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Property Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Type</span>
                  <span className="font-medium">{property.type}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Purpose</span>
                  <span className="font-medium">For {property.contractType}</span>
                </div>
                {property.furnishingStatus && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Furnishing</span>
                    <span className="font-medium">{property.furnishingStatus}</span>
                  </div>
                )}
                {property.completionStatus && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Completion</span>
                    <span className="font-medium">{property.completionStatus}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Parking</span>
                  <span className="font-medium">{property.parkingAvailable ? 'Available' : 'Not Available'}</span>
                </div>
              </div>
              {/* Property Details Component */}

            </div>

            {/* Property Highlight on mobile */}
            {property.highlight && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
                <h3 className="text-lg font-semibold mb-3">Property Highlight</h3>
                <p className="text-gray-700">{property.highlight}</p>
              </div>
            )}

          </div>

          <div className="md:hidden mb-6">
            {property && <PropertyDetails property={property} />}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Property Details Component */}
              <div className="hidden md:block mb-8">
                {property && <PropertyDetails property={property} />}
              </div>

              {/* Floor Plan */}
              {property.floorPlanImage && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Floor Plan</h2>
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <img
                    src={property.floorPlanImage}
                    alt="Floor Plan"
                    className="w-full rounded-lg"
                  />
                </div>
              )}

              {/* Location Map */}
              <PropertyMap properties={[property]} onPropertySelect={() => {}} customMapStyle={{height: 400}} />
              {/* Nearby Places */}
              {withNearByPlaces && property.lat && property.lng && (
                <NearbyPlaces propertyLat={property.lat} propertyLng={property.lng} />
              )}
            </div>

            {/* Price Card for Desktop */}
            <div className="lg:col-span-1 space-y-6">
              {property && <PriceCard property={property} />}
            </div>
          </div>
        </div>
      </main>

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
      {isDedicatedPage && <Footer />}
    </div>
  );
}
