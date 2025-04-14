import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Save, Video, Image as ImageIcon, MoveUp, Info, FileText, Car, Plus } from 'lucide-react';
import AddressAutocomplete from '../AddressAutocomplete';
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
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
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

  // Initialize form with property data if editing
  useEffect(() => {
    if (property) {
      setFormData({
        ...property,
        // Ensure these are set even if not in the property object
        amenities: property.amenities || [],
        videos: property.videos || [],
        parkingAvailable: property.parkingAvailable || false,
        type: property.type || 'Apartment',
        contractType: property.contractType || 'Sale',
        furnishingStatus: property.furnishingStatus || 'Unfurnished',
        completionStatus: property.completionStatus || 'Ready'
      });
      setImages(property.images || []);
      setVideos(property.videos || []);
      
      // Fetch custom amenities if editing
      fetchCustomAmenities(property.id);
    }
  }, [property]);

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

  const amenitiesList = [
    'Balcony',
    'Pool',
    'Gym',
    'Parking',
    'Security',
    'Central A/C',
    'Built-in Wardrobes',
    'Concierge'
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
      setError(null);
      const uploadedUrls = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          throw new Error('Please upload only image files');
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Image size should not exceed 5MB');
        }

        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const fileName = `${agentId}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('properties')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('properties')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      setImages(prev => [...prev, ...uploadedUrls]);
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedUrls]
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload images');
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
      setError(null);
      const uploadedUrls = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('video/')) {
          throw new Error('Please upload only video files');
        }

        if (file.size > 50 * 1024 * 1024) {
          throw new Error('Video size should not exceed 50MB');
        }

        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const fileName = `${agentId}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('properties')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('properties')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      setVideos(prev => [...prev, ...uploadedUrls]);
      setFormData(prev => ({
        ...prev,
        videos: [...(prev.videos || []), ...uploadedUrls]
      }));
    } catch (error) {
      console.error('Error uploading videos:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload videos');
    }
  };

  const handleFloorPlanUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);

      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload only image files');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size should not exceed 5MB');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${agentId}/floor-plans/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('properties')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('properties')
        .getPublicUrl(fileName);

      setFormData(prev => ({
        ...prev,
        floorPlanImage: publicUrl
      }));
    } catch (error) {
      console.error('Error uploading floor plan:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload floor plan');
    }
  };

  const handleFloorPlanDelete = async () => {
    if (!formData.floorPlanImage) return;

    try {
      const urlParts = formData.floorPlanImage.split('/');
      const filePath = `${agentId}/floor-plans/${urlParts[urlParts.length - 1]}`;

      const { error: deleteError } = await supabase.storage
        .from('properties')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      setFormData(prev => ({
        ...prev,
        floorPlanImage: undefined
      }));
    } catch (error) {
      console.error('Error deleting floor plan:', error);
      setError('Failed to delete floor plan');
    }
  };

  const handleImageDelete = async (imageUrl: string) => {
    try {
      const urlParts = imageUrl.split('/');
      const filePath = `${agentId}/${urlParts[urlParts.length - 1]}`;

      const { error: deleteError } = await supabase.storage
        .from('properties')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      setImages(prev => prev.filter(url => url !== imageUrl));
      setFormData(prev => ({
        ...prev,
        images: prev.images?.filter(url => url !== imageUrl) || []
      }));
    } catch (error) {
      console.error('Error deleting image:', error);
      setError('Failed to delete image');
    }
  };

  const handleVideoDelete = async (videoUrl: string) => {
    try {
      const urlParts = videoUrl.split('/');
      const filePath = `${agentId}/${urlParts[urlParts.length - 1]}`;

      const { error: deleteError } = await supabase.storage
        .from('properties')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      setVideos(prev => prev.filter(url => url !== videoUrl));
      setFormData(prev => ({
        ...prev,
        videos: prev.videos?.filter(url => url !== videoUrl) || []
      }));
    } catch (error) {
      console.error('Error deleting video:', error);
      setError('Failed to delete video');
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    setImages(newImages);
    setFormData(prev => ({ ...prev, images: newImages }));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

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

      console.log("Submitting property data:", propertyData);

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
      <section>
        <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
              placeholder="e.g., Luxury Waterfront Villa"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              required
              rows={5}
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
              placeholder="Provide a detailed description of the property..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Type *
            </label>
            <select
              required
              value={formData.type || 'Apartment'}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Property['type'] }))}
              className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            >
              <option value="Apartment">Apartment</option>
              <option value="Penthouse">Penthouse</option>
              <option value="Townhouse">Townhouse</option>
              <option value="House">House</option>
              <option value="Villa">Villa</option>
              <option value="Land">Land</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contract Type *
            </label>
            <select
              required
              value={formData.contractType || 'Sale'}
              onChange={(e) => setFormData(prev => ({ ...prev, contractType: e.target.value as Property['contractType'] }))}
              className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            >
              <option value="Sale">For Sale</option>
              <option value="Rent">For Rent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price *
            </label>
            <input
              type="number"
              required
              value={formData.price || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
              placeholder="Enter price"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Furnishing Status
            </label>
            <select
              value={formData.furnishingStatus || 'Unfurnished'}
              onChange={(e) => setFormData(prev => ({ ...prev, furnishingStatus: e.target.value as Property['furnishingStatus'] }))}
              className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            >
              <option value="Furnished">Furnished</option>
              <option value="Unfurnished">Unfurnished</option>
              <option value="Semi-Furnished">Semi-Furnished</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Completion Status
            </label>
            <select
              value={formData.completionStatus || 'Ready'}
              onChange={(e) => setFormData(prev => ({ ...prev, completionStatus: e.target.value as Property['completionStatus'] }))}
              className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            >
              <option value="Ready">Ready</option>
              <option value="Off-plan resale">Off-plan resale</option>
            </select>
          </div>
          
          {/* Handover Date - Only show for Off-plan resale */}
          {formData.completionStatus === 'Off-plan resale' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Handover Date *
              </label>
              <input
                type="date"
                required={formData.completionStatus === 'Off-plan resale'}
                value={formData.handoverDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, handoverDate: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                Expected handover date for this off-plan property
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Location */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Location</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address *
          </label>
          <AddressAutocomplete
            value={formData.location || ''}
            onChange={handleLocationChange}
            error={formData.location === '' ? 'Please select a valid UAE address' : undefined}
          />
          <p className="mt-2 text-sm text-gray-500">
            Select a valid UAE address from the suggestions to ensure accurate map placement
          </p>
        </div>
      </section>

      {/* Details */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Property Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bedrooms
            </label>
            <input
              type="number"
              min="0"
              value={formData.bedrooms || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bathrooms
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={formData.bathrooms || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Square Feet
            </label>
            <input
              type="number"
              min="0"
              value={formData.sqft || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, sqft: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Amenities</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Standard amenities */}
          {amenitiesList.map(amenity => (
            <label key={amenity} className="flex items-center space-x-3 group cursor-pointer">
              <input
                type="checkbox"
                checked={formData.amenities?.includes(amenity) || false}
                onChange={(e) => {
                  const currentAmenities = formData.amenities || [];
                  const newAmenities = e.target.checked
                    ? [...currentAmenities, amenity]
                    : currentAmenities.filter(a => a !== amenity);
                  setFormData(prev => ({ ...prev, amenities: newAmenities }));
                }}
                className="w-5 h-5 rounded border-gray-300 text-primary-300 focus:ring-primary-300 transition-colors duration-200"
              />
              <span className="text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
                {amenity}
              </span>
            </label>
          ))}
        </div>
        
        {/* Custom amenities */}
        <div className="mt-6">
          <h3 className="text-md font-medium mb-3">Custom Amenities</h3>
          
          {/* Custom amenity input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={customAmenity}
              onChange={(e) => setCustomAmenity(e.target.value)}
              placeholder="Add custom amenity"
              className="flex-1 px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleAddCustomAmenity}
              disabled={!customAmenity.trim()}
              className="px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </button>
          </div>
          
          {/* Custom amenity tags */}
          {customAmenities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {customAmenities.map(amenity => (
                <div 
                  key={amenity} 
                  className="flex items-center bg-gray-100 px-3 py-1.5 rounded-full"
                >
                  <span className="text-sm">{amenity}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomAmenity(amenity)}
                    className="ml-2 text-gray-500 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Photo Gallery */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Photo Gallery *</h2>
          <div className="text-sm text-gray-500 flex items-center">
            <MoveUp className="h-4 w-4 mr-1" />
            Drag to reorder
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative aspect-square cursor-move ${
                  draggedIndex === index ? 'opacity-50' : ''
                }`}
              >
                <img
                  src={image}
                  alt={`Property ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleImageDelete(image)}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center w-full">
            <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-400 rounded-lg tracking-wide uppercase border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200">
              <ImageIcon className="w-8 h-8" />
              <span className="mt-2 text-sm">Upload Images</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
              />
            </label>
          </div>
        </div>
      </section>

      {/* Video Gallery */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Video Gallery</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {videos.map((video, index) => (
              <div key={index} className="relative aspect-video">
                <video
                  src={video}
                  className="w-full h-full object-cover rounded-lg"
                  controls
                />
                <button
                  type="button"
                  onClick={() => handleVideoDelete(video)}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center w-full">
            <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-400 rounded-lg tracking-wide uppercase border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200">
              <Video className="w-8 h-8" />
              <span className="mt-2 text-sm">Upload Videos</span>
              <input
                type="file"
                className="hidden"
                accept="video/*"
                multiple
                onChange={handleVideoUpload}
              />
            </label>
          </div>
        </div>
      </section>

      {/* Floor Plan */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Floor Plan</h2>
        <div className="space-y-4">
          {formData.floorPlanImage && (
            <div className="relative w-full max-w-md">
              <img
                src={formData.floorPlanImage}
                alt="Floor Plan"
                className="w-full h-auto rounded-lg"
              />
              <button
                type="button"
                onClick={handleFloorPlanDelete}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {!formData.floorPlanImage && (
            <div className="flex items-center justify-center w-full">
              <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-400 rounded-lg tracking-wide uppercase border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <FileText className="w-8 h-8" />
                <span className="mt-2 text-sm">Upload Floor Plan</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFloorPlanUpload}
                />
              </label>
            </div>
          )}
        </div>
      </section>

      {/* Additional Features */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Additional Features</h2>
        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.parkingAvailable || false}
              onChange={(e) => setFormData(prev => ({ ...prev, parkingAvailable: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-primary-300 focus:ring-primary-300"
            />
            <span className="flex items-center text-gray-700">
              <Car className="w-5 h-5 mr-2" />
              Parking Available
            </span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.shared || false}
              onChange={(e) => setFormData(prev => ({ ...prev, shared: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-primary-300 focus:ring-primary-300"
            />
            <span className="flex items-center text-gray-700">
              <Info className="w-5 h-5 mr-2" />
              List in Marketplace
            </span>
          </label>
        </div>
      </section>
    </form>
  );
}