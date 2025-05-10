import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import BasicInformation from '../property/property-form/BasicInformation';
import LocationSection from '../property/property-form/LocationSection';
import DetailsSection from '../property/property-form/DetailsSection';
import AmenitiesSection from '../property/property-form/AmenitiesSection';
import CustomAmenitiesSection from '../property/property-form/CustomAmenitiesSection';
import MediaGallery from "../property/property-form/MediaGallery.tsx";
import AdditionalFeatures from '../property/property-form/AdditionalFeatures';
import { Property } from '../../types';
import { supabase } from '../../utils/supabase';

interface AgentPropertyFormProps {
  agentId: string;
  property?: Property;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function AgentPropertyForm({ agentId, property, onSuccess, onCancel }: AgentPropertyFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Property>>({
    type: 'Apartment',
    contractType: 'Sale',
    images: [],
    videos: [],
    shared: false,
    furnishingStatus: 'Unfurnished',
    completionStatus: 'Ready',
    amenities: [],
    parkingAvailable: false
  });
  const [customAmenity, setCustomAmenity] = useState('');
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);

  // Fetch custom amenities for a property
  const fetchCustomAmenities = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
          .from('custom_amenities')
          .select('name')
          .eq('property_id', propertyId);

      if (error) throw error;

      if (data) {
        setCustomAmenities(data.map(item => item.name));
      }
    } catch (err) {
      console.error('Error fetching custom amenities:', err);
    }
  };

  // Initialize form with property data if editing
  useEffect(() => {
    if (property) {
      setFormData({
        ...property,
        // Ensure these are set even if not in the property object
        amenities: property.amenities || [],
        videos: property.videos || [],
        images: property.images || [],
        parkingAvailable: property.parkingAvailable || false,
        type: property.type || 'Apartment',
        contractType: property.contractType || 'Sale',
        furnishingStatus: property.furnishingStatus || 'Unfurnished',
        completionStatus: property.completionStatus || 'Ready'
      });
      // Fetch custom amenities if editing
      fetchCustomAmenities(property.id);
    }
  }, [property]);


  const amenitiesList = [
    'Balcony',
    'Pool',
    'Gym',
    'Parking',
    'Security',
    'Central A/C',
    'Built-in Wardrobes',
    'Concierge',
  ];

  // Add custom amenity
  const handleAddCustomAmenity = () => {
    if (!customAmenity.trim()) return;

    // Check if amenity already exists (either in standard or custom list)
    if (
      formData.amenities?.includes(customAmenity) ||
      customAmenities.includes(customAmenity) ||
      amenitiesList.includes(customAmenity)
    ) {
      alert('This amenity already exists');
      return;
    }

    setCustomAmenities(prev => [...prev, customAmenity]);
    setCustomAmenity('');
  };

  // Remove custom amenity
  const handleRemoveCustomAmenity = (amenity: string) => {
    setCustomAmenities(prev => prev.filter(a => a !== amenity));
  };

  const handleImagesChange = (updatedImages: string[]) => {
    setFormData(prev => ({
      ...prev,
      images: updatedImages
    }));
  };

  const handleVideosChange = (updatedVideos: string[]) => {
    setFormData(prev => ({
      ...prev,
      videos: updatedVideos
    }));
  };

  const handleFloorPlanChange = (updatedImage: string[]) => {
    setFormData(prev => ({
      ...prev,
      floorPlanImage: updatedImage.length ? updatedImage[0] : null
    }));
  };

  const onChangeForm = (newValue: Partial<Property>) => {
    setFormData(prev => ({
      ...prev,
      ...newValue
    }));
  }



  const handleLocationChange = (address: string, lat?: number, lng?: number) => {
    setFormData(prev => ({
      ...prev,
      location: address,
      lat: lat || null,
      lng: lng || null
    }));
  };

  const validateProperty = () => {
    if (!formData.title?.trim()) {
      throw new Error('Title is required');
    }
    if (!formData.description?.trim()) {
      throw new Error('Description is required');
    }
    if (!formData.price || formData.price <= 0) {
      throw new Error('Valid price is required');
    }
    if (!formData.location?.trim()) {
      throw new Error('Location is required');
    }
    if (!formData.images?.length) {
      throw new Error('At least one image is required');
    }
    if (!formData.type) {
      throw new Error('Property type is required');
    }
    if (!formData.contractType) {
      throw new Error('Contract type is required');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      validateProperty();

      const propertyData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        contract_type: formData.contractType,
        price: formData.price,
        location: formData.location,
        bedrooms: formData.bedrooms || null,
        bathrooms: formData.bathrooms || null,
        sqft: formData.sqft || null,
        highlight: formData.highlight || null,
        images: formData.images || [],
        videos: formData.videos || [],
        agent_id: agentId,
        shared: formData.shared || false,
        amenities: formData.amenities || [],
        furnishing_status: formData.furnishingStatus || null,
        completion_status: formData.completionStatus || null,
        handover_date: formData.completionStatus === 'Off-plan resale' ? formData.handoverDate : null,
        lat: formData.lat || null,
        lng: formData.lng || null,
        creator_type: 'agent',
        creator_id: agentId,
        floor_plan_image: formData.floorPlanImage || null,
        parking_available: formData.parkingAvailable || false,
        updated_at: new Date().toISOString()
      };

      if (property?.id) {
        // Update existing property
        const { error: updateError } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', property.id);

        if (updateError) throw updateError;
      } else {
        // Create new property
        const { error: insertError } = await supabase
          .from('properties')
          .insert([{
            ...propertyData,
            created_at: new Date().toISOString()
          }]);

        if (insertError) throw insertError;
      }

      // Save custom amenities if property is created/updated successfully
      if (property?.id) {
        // For existing property, first delete all custom amenities
        await supabase
          .from('custom_amenities')
          .delete()
          .eq('property_id', property.id);
      }

      // Insert custom amenities
      if (customAmenities.length > 0) {
        const propertyId = property?.id || (await supabase
          .from('properties')
          .select('id')
          .eq('title', propertyData.title)
          .single()).data?.id;

        if (propertyId) {
          const customAmenitiesData = customAmenities.map(name => ({
            property_id: propertyId,
            name,
            created_by: agentId
          }));

          await supabase
            .from('custom_amenities')
            .insert(customAmenitiesData);
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving property:', error);
      setError(error instanceof Error ? error.message : 'Failed to save property');
    } finally {
      setLoading(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {property ? 'Edit Property' : 'Add New Property'}
        </h1>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel || (() => window.history.back())}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <X className="h-5 w-5 mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-primary-300 text-on-primary rounded-md hover:bg-primary-400 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⌛</span>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Property
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <BasicInformation
        formData={formData}
        setFormData={onChangeForm}
      />

      {/* Location */}
      <LocationSection
        location={formData.location || ''}
        onLocationChange={handleLocationChange}
      />

      {/* Details */}
      <DetailsSection
        formData={formData}
        setFormData={onChangeForm}
      />

      {/* Amenities */}
      <AmenitiesSection
        amenitiesList={amenitiesList}
        selectedAmenities={formData.amenities || []}
        onAmenitiesChange={(updatedAmenities) =>
          setFormData((prev) => ({ ...prev, amenities: updatedAmenities }))
        }
      />

      {/* Custom Amenities */}
      <CustomAmenitiesSection
        customAmenity={customAmenity}
        customAmenities={customAmenities}
        onCustomAmenityChange={setCustomAmenity}
        onAddCustomAmenity={handleAddCustomAmenity}
        onRemoveCustomAmenity={handleRemoveCustomAmenity}
      />

      <MediaGallery
          userId={agentId}
          media={formData.images || []}
          onMediaChange={handleImagesChange}
          maxFileSizeMB={5}
          maxFiles={20}
          title={"Photo Gallery"}
          type={"image"}
          bucketName={'properties'} />

      <MediaGallery
          userId={agentId}
          media={formData.videos || []}
          onMediaChange={handleVideosChange}
          maxFileSizeMB={50}
          title={"Video Gallery"}
          maxFiles={2}
          type={"video"}
          bucketName={'properties'} />

      <MediaGallery
        userId={agentId}
        media={formData.floorPlanImage ? [formData.floorPlanImage] : []}
        onMediaChange={handleFloorPlanChange}
        maxFileSizeMB={5}
        title="Floor Plan"
        maxFiles={1}
        type="image"
        bucketName="properties"
      />

      {/* Additional Features */}
      <AdditionalFeatures
        formData={formData}
        setFormData={onChangeForm}
        withListInMarketplace={true}
      />
    </form>
  );
}

