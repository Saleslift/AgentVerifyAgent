import React, {useState, useEffect, useCallback} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {FileText, Share2} from 'lucide-react';
import NearbyPlaces from '../components/property/NearbyPlaces';
import PropertyDetails from '../components/property/PropertyDetails';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {Property, UnitType} from '../types';
import {supabase} from '../utils/supabase';
import {useCurrency} from '../contexts/CurrencyContext';
import {initPageVisibilityHandling, cleanupPageVisibilityHandling} from '../utils/pageVisibility';
import ShareModal from '../components/property/ShareModal';
import FullscreenGallery from '../components/property/FullscreenGallery';
import MainImageGallery from '../components/property/MainImageGallery';
import PropertyDetailsRightCard from '../components/property/PropertyDetailsRightCard.tsx';
import PropertyMap from "../components/PropertyMap.tsx";
import UnitTypeCard from '../components/property/UnitTypeCard';
import {convertSnakeToCamel} from "../utils/helpers.ts";
import { useTranslation } from 'react-i18next';

type PropertyPageProps = {
    slug?: string;
    withNearByPlaces?: boolean;
}

export default function PropertyPage(props: PropertyPageProps) {
    const { t } = useTranslation();
    const {slug: propsSlug, withNearByPlaces = true} = props;
    const {slug: routeSlug, unitTypeId} = useParams(); // Extract unitTypeId from URL
    const slug = propsSlug || routeSlug;
    const navigate = useNavigate();
    const {formatPrice} = useCurrency();
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showGallery, setShowGallery] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [property, setProperty] = useState<Property | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showCopiedMessage, setShowCopiedMessage] = useState(false);
    const [unitTypes, setUnitTypes] = useState<any[]>([]);

    // Initialize page visibility handling to prevent reloads
    useEffect(() => {
        initPageVisibilityHandling();
        return () => cleanupPageVisibilityHandling();
    }, []);

    useEffect(() => {
        if (unitTypeId) {
            fetchUnitTypeWithPropertyFields();
        } else {
            fetchProperty();
        }
    }, [slug, unitTypeId]);

    useEffect(() => {
        if (property) {
            fetchUnitTypes();
        }
    }, [property])

    const fetchUnitTypeWithPropertyFields = async () => {
        try {
            if (!unitTypeId) return;

            // Fetch UnitType and include missing Property fields
            const {data, error} = await supabase
                .from('unit_types')
                .select(`
          *,
          project:project_id(
            location,
            lat,
            lng,
            highlight,
            contract_type
          )
        `)
                .eq('id', unitTypeId)
                .single();

            if (error) throw error;

            const unitType = convertSnakeToCamel(data) as UnitType & { project: DB_Properties };
            const newProperty: Partial<Property> = convertSnakeToCamel(unitType?.project)
            const combinedData = {
                ...newProperty,
                ...unitType, // Merge missing Property fields
            };

            setProperty(combinedData as Property);
        } catch (err) {
            console.error('Error fetching unit type with property fields:', err);
            setError('Failed to load property details');
        } finally {
            setLoading(false);
        }
    };

    const fetchProperty = async () => {
        try {
            if (!slug) return;

            const {data, error: fetchError} = await supabase
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
            const transformedData: Property = convertSnakeToCamel(data)

            setProperty(transformedData);
        } catch (err) {
            console.error('Error fetching property:', err);
            setError('Failed to load property details');
        } finally {
            setLoading(false);
        }
    };


    const fetchUnitTypes = async () => {
        try {
            if (!property?.id) {
                return;
            }

            const {data, error} = await supabase
                .from('unit_types')
                .select('*')
                .eq('project_id', property.id);

            if (error) throw error;

            setUnitTypes(data || []);
        } catch (err) {
            console.error('Error fetching unit types:', err);
        }
    };

    const handlePrevImage = () => {
        if (!property) return;
        setActiveImageIndex((prev) =>
            prev === 0 ? (property?.images?.length || 1) - 1 : prev - 1
        );
    };

    const handleNextImage = () => {
        if (!property) return;
        setActiveImageIndex((prev) =>
            prev === 0 ? (property.images?.length || 1) - 1 : prev - 1
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

    const handleViewDetails = (id: string) => {
        navigate(`unit-types/${id}`);
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
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('error')}</h2>
                    <p className="text-gray-600">{error || t('propertyNotFound')}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
                    >
                        {t('returnHome')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header isAgentProfilePage={false} /> {/* Ensure LanguageSelectorMenu is rendered */}

            <main className="pt-20 bg-white">
                <div className="container mx-auto px-4 py-6">
                    {/* Price and Address Section */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-3xl font-bold text-black">
                                {property.price ? formatPrice(property.price) : null}
                            </h2>
                            <button
                                onClick={handleShare}
                                className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <Share2 className="h-6 w-6"/>
                            </button>
                        </div>
                        <p className="text-gray-700 text-lg mb-2">{property?.location}</p>
                        <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
                    </div>

                    {/* Main Image with Gallery */}
                    <MainImageGallery
                        images={property.images || []}
                        activeImageIndex={activeImageIndex}
                        onSetActiveImageIndex={setActiveImageIndex}
                        onShowGallery={() => setShowGallery(true)}
                        onPrevImage={handlePrevImage}
                        onNextImage={handleNextImage}
                    />

                    {/* Fullscreen Gallery */}
                    {showGallery && (
                        <FullscreenGallery
                            images={property.images || []}
                            initialIndex={activeImageIndex}
                            onClose={() => setShowGallery(false)}
                        />
                    )}

                    {/* Mobile Property Details - Shown at the top on mobile */}
                    <div className="md:hidden mb-6">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <h3 className="text-lg font-semibold mb-4">{t('propertyDetails')}</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">{t('type')}</span>
                                    <span className="font-medium">{property.type}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">{t('purpose')}</span>
                                    <span className="font-medium">{t('for')} {property.contractType}</span>
                                </div>
                                {property.furnishingStatus && (
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">{t('furnishing')}</span>
                                        <span className="font-medium">{property.furnishingStatus}</span>
                                    </div>
                                )}
                                {property.completionStatus && (
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-gray-600">{t('completion')}</span>
                                        <span className="font-medium">{property.completionStatus}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">{t('parking')}</span>
                                    <span
                                        className="font-medium">{property.parkingAvailable ? t('available') : t('notAvailable')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Property Highlight on mobile */}
                        {property?.highlight && (
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
                                <h3 className="text-lg font-semibold mb-3">{t('propertyHighlight')}</h3>
                                <p className="text-gray-700">{property?.highlight}</p>
                            </div>
                        )}

                    </div>

                    <div className="md:hidden mb-6">
                        {property && <PropertyDetails property={property}/>}
                    </div>


                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            {/* Property Details Component */}
                            <div className="hidden md:block mb-8">
                                {property && <PropertyDetails property={property}/>}
                            </div>

                            {/* Floor Plan */}
                            {property.floorPlanImage && (
                                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-semibold">{t('floorPlan')}</h2>
                                        <FileText className="h-6 w-6 text-gray-400"/>
                                    </div>
                                    <img
                                        src={property.floorPlanImage}
                                        alt={t('floorPlan')}
                                        className="w-full rounded-lg"
                                    />
                                </div>
                            )}
                            {/* Unit Types Section */}
                            {unitTypes.length > 0 && (
                                <div className="mt-8 mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('unitTypes')}</h2>
                                    <div className="grid lg:grid-cols-2 gap-8">
                                        {unitTypes.map((unitType) => (
                                            <UnitTypeCard
                                                key={unitType.id}
                                                unitType={unitType}
                                                onViewDetails={handleViewDetails}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Location Map */}
                            <PropertyMap properties={[property]} onPropertySelect={() => {
                            }} customMapStyle={{height: 400}}/>
                            {/* Nearby Places */}
                            {withNearByPlaces && property?.lat && property?.lng && (
                                <NearbyPlaces propertyLat={property?.lat} propertyLng={property?.lng}/>
                            )}
                        </div>

                        {/* Price Card for Desktop */}
                        <div className="lg:col-span-1 space-y-6">
                            {property && <PropertyDetailsRightCard property={property}/>}
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
                <div
                    className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg text-sm animate-fade-in z-50">
                    {t('linkCopied')}
                </div>
            )}
            <Footer/>

        </div>
    );
}

