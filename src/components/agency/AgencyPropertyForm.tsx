import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Save, Video, Image as ImageIcon, MoveUp, Info, Users } from 'lucide-react';
import AddressAutocomplete from '../AddressAutocomplete';
import { Property, Agent } from '../../types';
import { supabase } from '../../utils/supabase';
import SharedPropertiesAgentSelector from './SharedPropertiesAgentSelector';

interface AgencyPropertyFormProps {
  agencyId: string;
  property?: Property;
  onSuccess: () => void;
}

export default function AgencyPropertyForm({ agencyId, property, onSuccess }: AgencyPropertyFormProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [shareWithAllAgents, setShareWithAllAgents] = useState(false);
  const [agencyAgents, setAgencyAgents] = useState<Agent[]>([]);
  const [propertyData, setPropertyData] = useState<Partial<Property>>({
    type: 'Apartment',
    contractType: 'Sale',
    images: [],
    videos: [],
    shared: false,
    furnishingStatus: 'Unfurnished',
    completionStatus: 'Ready',
    amenities: []
  });

  // Initialize form with property data if editing
  useEffect(() => {
    if (property) {
      setPropertyData({
        ...property,
        images: property.images || [],
        videos: property.videos || [],
        amenities: property.amenities || []
      });
      setImages(property.images || []);
      setVideos(property.videos || []);
      
      // Fetch existing shares
      fetchExistingShares();
    }
    
    // Fetch agents
    fetchAgencyAgents();
  }, [property, agencyId]);

  const fetchExistingShares = async () => {
    if (!property) return;
    
    try {
      // First check if we're sharing with all agents
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('shared_with_all_agents')
        .eq('id', property.id)
        .single();

      if (propertyError) throw propertyError;
      
      setShareWithAllAgents(propertyData?.shared_with_all_agents || false);
      
      if (!propertyData?.shared_with_all_agents) {
        // Fetch specific agent shares
        const { data: sharedAgents, error: sharesError } = await supabase
          .from('shared_properties')
          .select('agent_id')
          .eq('property_id', property.id)
          .eq('shared_by_agency_id', agencyId);

        if (sharesError) throw sharesError;
        
        const agentIds = sharedAgents?.map(share => share.agent_id) || [];
        setSelectedAgentIds(agentIds);
      }
    } catch (error) {
      console.error('Error fetching existing shares:', error);
      setError('Failed to load existing sharing settings');
    }
  };

  const fetchAgencyAgents = async () => {
    try {
      const { data: agentData, error: agentError } = await supabase
        .from('agency_agents')
        .select(`
          id,
          agent:agent_id(
            id,
            full_name,
            email,
            avatar_url,
            whatsapp
          ),
          status,
          created_at
        `)
        .eq('agency_id', agencyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (agentError) throw agentError;
      
      // Transform data
      const transformedAgents: Agent[] = agentData
        ? agentData.map(item => ({
            id: item.agent.id,
            full_name: item.agent.full_name,
            email: item.agent.email,
            avatar_url: item.agent.avatar_url,
            whatsapp: item.agent.whatsapp,
            status: item.status,
            created_at: item.created_at,
            agency_id: agencyId
          }))
        : [];
      
      setAgencyAgents(transformedAgents);
    } catch (error) {
      console.error('Error fetching agents:', error);
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
        const fileName = `${agencyId}/${crypto.randomUUID()}.${fileExt}`;

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
      setPropertyData(prev => ({
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
        const fileName = `${agencyId}/${crypto.randomUUID()}.${fileExt}`;

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
      setPropertyData(prev => ({
        ...prev,
        videos: [...(prev.videos || []), ...uploadedUrls]
      }));
    } catch (error) {
      console.error('Error uploading videos:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload videos');
    }
  };

  const handleImageDelete = async (imageUrl: string) => {
    try {
      const urlParts = imageUrl.split('/');
      const filePath = `${agencyId}/${urlParts[urlParts.length - 1]}`;

      const { error: deleteError } = await supabase.storage
        .from('properties')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      setImages(prev => prev.filter(url => url !== imageUrl));
      setPropertyData(prev => ({
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
      const filePath = `${agencyId}/${urlParts[urlParts.length - 1]}`;

      const { error: deleteError } = await supabase.storage
        .from('properties')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      setVideos(prev => prev.filter(url => url !== videoUrl));
      setPropertyData(prev => ({
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
    setPropertyData(prev => ({ ...prev, images: newImages }));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleLocationChange = (address: string, lat?: number, lng?: number) => {
    setPropertyData(prev => ({
      ...prev,
      location: address,
      lat: lat || null,
      lng: lng || null
    }));
  };

  const validateProperty = () => {
    if (!propertyData.title?.trim()) {
      throw new Error('Title is required');
    }
    if (!propertyData.description?.trim()) {
      throw new Error('Description is required');
    }
    if (!propertyData.price || propertyData.price <= 0) {
      throw new Error('Valid price is required');
    }
    if (!propertyData.location?.trim()) {
      throw new Error('Location is required');
    }
    if (!propertyData.images?.length) {
      throw new Error('At least one image is required');
    }
    if (!propertyData.type || !propertyData.contractType) {
      throw new Error('Property type and contract type are required');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      validateProperty();

      // Create property data object
      const propertyDataToSave = {
        title: propertyData.title,
        description: propertyData.description,
        type: propertyData.type,
        contract_type: propertyData.contractType,
        price: propertyData.price,
        location: propertyData.location,
        bedrooms: propertyData.bedrooms || null,
        bathrooms: propertyData.bathrooms || null,
        sqft: propertyData.sqft || null,
        highlight: propertyData.highlight || null,
        images: propertyData.images || [],
        videos: propertyData.videos || [],
        agent_id: agencyId,
        shared: propertyData.shared || false,
        amenities: propertyData.amenities || [],
        furnishing_status: propertyData.furnishingStatus || null,
        completion_status: propertyData.completionStatus || null,
        lat: propertyData.lat || null,
        lng: propertyData.lng || null,
        creator_type: 'agency',
        creator_id: agencyId,
        shared_with_all_agents: shareWithAllAgents
      };

      let propertyId: string;
      
      if (property?.id) {
        // Update existing property
        const { error: updateError } = await supabase
          .from('properties')
          .update(propertyDataToSave)
          .eq('id', property.id);

        if (updateError) throw updateError;
        
        propertyId = property.id;
      } else {
        // Create new property
        const { data: savedProperty, error: saveError } = await supabase
          .from('properties')
          .insert([{
            ...propertyDataToSave,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (saveError) throw saveError;
        
        propertyId = savedProperty.id;
      }

      // Handle agent sharing
      if (shareWithAllAgents) {
        // Remove any specific agent shares
        await supabase
          .from('shared_properties')
          .delete()
          .eq('property_id', propertyId)
          .eq('shared_by_agency_id', agencyId);
      } else {
        // First get existing shares to determine what to add/remove
        const { data: existingShares, error: sharesError } = await supabase
          .from('shared_properties')
          .select('agent_id')
          .eq('property_id', propertyId)
          .eq('shared_by_agency_id', agencyId);
          
        if (sharesError) throw sharesError;
        
        const existingAgentIds = existingShares?.map(share => share.agent_id) || [];
        
        // Agents to remove (in existing but not in selected)
        const agentsToRemove = existingAgentIds.filter(id => !selectedAgentIds.includes(id));
        
        // Agents to add (in selected but not in existing)
        const agentsToAdd = selectedAgentIds.filter(id => !existingAgentIds.includes(id));
        
        // Remove agents no longer selected
        if (agentsToRemove.length > 0) {
          const { error: deleteError } = await supabase
            .from('shared_properties')
            .delete()
            .eq('property_id', propertyId)
            .eq('shared_by_agency_id', agencyId)
            .in('agent_id', agentsToRemove);
            
          if (deleteError) throw deleteError;
        }
        
        // Add newly selected agents
        if (agentsToAdd.length > 0) {
          const newShares = agentsToAdd.map(agentId => ({
            property_id: propertyId,
            agent_id: agentId,
            shared_by_agency_id: agencyId,
            notified: false
          }));
          
          const { error: insertError } = await supabase
            .from('shared_properties')
            .insert(newShares);
            
          if (insertError) throw insertError;
        }
      }

      // Navigate to properties
      navigate('/agency-dashboard/properties');
      
      // Call success callback
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
        <h1 className="text-2xl font-bold text-gray-900">{property ? 'Edit Property' : 'Add New Property'}</h1>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
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

      {/* Agent Assignment */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Property Visibility Settings</h2>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Users className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-gray-700">Choose which agents can see this property</span>
          </div>
          
          <SharedPropertiesAgentSelector
            agencyId={agencyId}
            selectedAgentIds={selectedAgentIds}
            onAgentSelect={setSelectedAgentIds}
            shareWithAllAgents={shareWithAllAgents}
            onShareWithAllAgentsChange={setShareWithAllAgents}
          />
        </div>
      </section>

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
              value={propertyData.title || ''}
              onChange={(e) => setPropertyData(prev => ({ ...prev, title: e.target.value }))}
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
              value={propertyData.description || ''}
              onChange={(e) => setPropertyData(prev => ({ ...prev, description: e.target.value }))}
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
              value={propertyData.type}
              onChange={(e) => setPropertyData(prev => ({ ...prev, type: e.target.value as Property['type'] }))}
              className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            >
              <option value="Apartment">Apartment</option>
              <option value="House">House</option>
              <option value="Villa">Villa</option>
              <option value="Land">Land</option>
              <option value="Town house">Town house</option>
              <option value="Penthouse">Penthouse</option>
              <option value="Townhouse">Townhouse</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contract Type *
            </label>
            <select
              required
              value={propertyData.contractType}
              onChange={(e) => setPropertyData(prev => ({ ...prev, contractType: e.target.value as Property['contractType'] }))}
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
              value={propertyData.price || ''}
              onChange={(e) => setPropertyData(prev => ({ ...prev, price: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
              placeholder="Enter price"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Furnishing Status
            </label>
            <select
              value={propertyData.furnishingStatus}
              onChange={(e) => setPropertyData(prev => ({ ...prev, furnishingStatus: e.target.value as Property['furnishingStatus'] }))}
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
              value={propertyData.completionStatus}
              onChange={(e) => setPropertyData(prev => ({ ...prev, completionStatus: e.target.value as Property['completionStatus'] }))}
              className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            >
              <option value="Ready">Ready</option>
              <option value="Off-Plan">Off-Plan</option>
              <option value="Off-plan resale">Off-plan resale</option>
            </select>
          </div>
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
            value={propertyData.location || ''}
            onChange={handleLocationChange}
            error={propertyData.location === '' ? 'Please select a valid UAE address' : undefined}
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
              value={propertyData.bedrooms || ''}
              onChange={(e) => setPropertyData(prev => ({ ...prev, bedrooms: Number(e.target.value) }))}
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
              value={propertyData.bathrooms || ''}
              onChange={(e) => setPropertyData(prev => ({ ...prev, bathrooms: Number(e.target.value) }))}
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
              value={propertyData.sqft || ''}
              onChange={(e) => setPropertyData(prev => ({ ...prev, sqft: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Amenities</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {amenitiesList.map(amenity => (
            <label key={amenity} className="flex items-center space-x-3 group cursor-pointer">
              <input
                type="checkbox"
                checked={propertyData.amenities?.includes(amenity) || false}
                onChange={(e) => {
                  const currentAmenities = propertyData.amenities || [];
                  const newAmenities = e.target.checked
                    ? [...currentAmenities, amenity]
                    : currentAmenities.filter(a => a !== amenity);
                  setPropertyData(prev => ({ ...prev, amenities: newAmenities }));
                }}
                className="w-5 h-5 rounded border-gray-300 text-primary-300 focus:ring-primary-300 transition-colors duration-200"
              />
              <span className="text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
                {amenity}
              </span>
            </label>
          ))}
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
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                    Cover Photo
                  </div>
                )}
              </div>
            ))}
            <label className="relative aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <ImageIcon className="h-8 w-8 mb-2" />
                <span className="text-sm">Add Photos</span>
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* Videos */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Videos</h2>
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
            <label className="relative aspect-video border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer">
              <input
                type="file"
                multiple
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <Video className="h-8 w-8 mb-2" />
                <span className="text-sm">Add Videos</span>
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* Additional Information */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Highlight Feature
          </label>
          <input
            type="text"
            value={propertyData.highlight || ''}
            onChange={(e) => setPropertyData(prev => ({ ...prev, highlight: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            placeholder="e.g., Private dock and infinity pool"
          />
        </div>
      </section>

      {/* Marketplace Sharing */}
      <section className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <input
            type="checkbox"
            id="shared"
            checked={propertyData.shared}
            onChange={(e) => setPropertyData(prev => ({ ...prev, shared: e.target.checked }))}
            className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-300 focus:ring-primary-300"
          />
          <div>
            <label htmlFor="shared" className="block text-sm font-medium text-gray-900 mb-1">
              Share on Marketplace
            </label>
            <p className="text-sm text-gray-600">
              I agree to share this property on the marketplace. It will allow other agents to market and add your property in their portfolio. This will increase your chances of closing a deal much faster. You agree to share 50% commission when the agent sells or rents it.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </section>
    </form>
  );
}