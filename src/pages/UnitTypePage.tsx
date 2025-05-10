import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building, Ruler, Maximize2 } from 'lucide-react';
import MainImageGallery from '../components/property/MainImageGallery';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '../utils/supabase';
import FullscreenGallery from '../components/property/FullscreenGallery';
import PropertyMap from "../components/PropertyMap.tsx";

type UnitType = {
  id: string;
  images: string[];
  name: string;
  price_range: string;
  floor_range: string | null;
  size_range: string | null;
  floor_plan_image: string | null;
};

type UnitTypePageProps = {
  shouldDisplayAsPDF?: string;
  id: string;
  slug: string;
}

export default function UnitTypePage(props: UnitTypePageProps) {
  const { id: unitTypeIdProps,  slug: slugProps, shouldDisplayAsPDF: shouldDisplayAsPDFProps = false } = props;
  const { id = unitTypeIdProps, slug: propertySlug = slugProps, shouldDisplayAsPDF = shouldDisplayAsPDFProps } = useParams();
  const navigate = useNavigate();
  const [unitType, setUnitType] = useState<UnitType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [property, setProperty] = useState<DB_Properties | null>(null);
  const [fullscreenImages, setFullscreenImages] = useState<Array<string |null> | null>(null);

  const getStartRange = (prop: string) => {
    const priceParts = prop.split('-');
    if (priceParts.length > 0) {
      return priceParts[0].trim();
    }
    return '';
  }

  useEffect(() => {
    if (id) {
      fetchUnitType(id);
    }
    if (propertySlug) {
      fetchProperty();
    }
  }, [id]);

  const fetchProperty = async () => {
    try {
      if (!propertySlug) return;

      const { data, error: fetchError } = await supabase
          .from('properties')
          .select(`*`)
          .eq('slug', propertySlug)
          .single();

      if (fetchError){
        throw fetchError;
      }


      setProperty(data);
    } catch (err) {
      console.error('Error fetching property:', err);
      setError('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnitType = async (unitTypeId: string) => {
    try {
      const { data, error } = await supabase
        .from('unit_types')
        .select('*')
        .eq('id', unitTypeId)
        .single();

      if (error) throw error;

      setUnitType(data as UnitType);
    } catch (err) {
      console.error('Error fetching unit type:', err);
      setError('Failed to load unit type details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error || !unitType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error || 'Unit type not found'}</p>
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
    <div className="min-h-screen bg-gray-50" id={'unit-types-main-page'}>
      {!shouldDisplayAsPDF && <Header />}
      <main className="pt-20 bg-white">
        <div className="container mx-auto px-4 py-6">
          {/* Title and Price */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{`${property?.title}: ${unitType.title}`}</h1>
            <p className="text-lg text-gray-700 mt-2">
              Starting from {getStartRange(unitType.price_range)} AED
            </p>
          </div>

          {/* Images Section */}
          {shouldDisplayAsPDF ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {unitType.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Unit Type Image ${index + 1}`}
                  className="w-full h-auto rounded-lg border border-gray-200"
                />
              ))}
            </div>
          ) : (
            <MainImageGallery
              images={unitType.images }
              activeImageIndex={activeImageIndex}
              onSetActiveImageIndex={setActiveImageIndex}
              onShowGallery={() => setFullscreenImages(unitType.images)}
              onPrevImage={() =>
                setActiveImageIndex((prev) =>
                  prev === 0 ? unitType.images.length - 1 : prev - 1
                )
              }
              onNextImage={() =>
                setActiveImageIndex((prev) =>
                  prev === unitType.images.length - 1 ? 0 : prev + 1
                )
              }
            />
          )}

          {/* Details Section and Floor Plan */}
          <div className="grid lg:grid-cols-2 gap-8 mt-8">
            {/* Floor Plan */}
            {unitType.floor_plan_image && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Floor Plan</h2>
                  {!shouldDisplayAsPDF && (
                    <button
                      onClick={() => setFullscreenImages([unitType.floor_plan_image])}
                      className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Maximize2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <div className="aspect-square">
                  <img
                    src={unitType.floor_plan_image}
                    alt="Floor Plan"
                    className="w-full h-full object-cover rounded-lg border border-gray-200"
                  />
                </div>
              </div>
            )}

            {/* Details Section */}
            <div className="space-y-4">
              {unitType.floor_range && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 flex items-center">
                  <Building className="h-6 w-6 text-gray-500 mr-4" />
                  <span className="text-gray-700">
                    Floor Range: {unitType.floor_range}
                  </span>
                </div>
              )}

              {unitType.size_range && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 flex items-center">
                  <Ruler className="h-6 w-6 text-gray-500 mr-4" />
                  <span className="text-gray-700">
                    Size: {getStartRange(unitType.size_range)} sqft
                  </span>
                </div>
              )}
              {property && <PropertyMap properties={[property]} onPropertySelect={() => {}} customMapStyle={{height: 400}} />}

            </div>
          </div>
        </div>
      </main>

      {/* Fullscreen Gallery */}
      {!shouldDisplayAsPDF && fullscreenImages && (
        <FullscreenGallery
          images={fullscreenImages}
          initialIndex={0}
          onClose={() => setFullscreenImages(null)}
        />
      )}

      {!shouldDisplayAsPDF && <Footer />}
    </div>
  );
}
