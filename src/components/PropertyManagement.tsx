import React, { useState, useEffect } from 'react';
import { Filter, Map as MapIcon, List, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Property, PropertyFilters } from '../types';
import PropertyCard from './PropertyCard';
import PropertyFilterPanel from './PropertyFilters';
import PropertyMap from './PropertyMap';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { supabase } from '../utils/supabase';
import AgentPropertyForm from './agent/AgentPropertyForm';
import CurrencySelector from './CurrencySelector';

interface PropertyManagementProps {
  agentId?: string;
  properties: Property[];
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onAddToListings?: (id: string) => void;
  showAddButton?: boolean;
  loading?: boolean;
  error?: string | null;
  addingProperty?: string | null;
  showOriginTag?: boolean;
}

export default function PropertyManagement({
  agentId,
  properties: initialProperties,
  onDelete,
  onEdit,
  onAddToListings,
  showAddButton = true,
  loading: isLoading = false,
  error: propError,
  addingProperty,
  showOriginTag = false
}: PropertyManagementProps) {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');
  const [deletingProperty, setDeletingProperty] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [showEditModal, setShowEditModal] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Number of properties per page

  // Update local properties when initialProperties changes
  useEffect(() => {
    setProperties(initialProperties);
  }, [initialProperties]);

  // Sort properties based on selected option
  const sortedProperties = [...properties].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
      default:
        // Default sort by creation date (newest first)
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
    }
  });

  // Filter properties based on selected filters
  const filteredProperties = sortedProperties.filter(property => {
    if (filters.type && property.type !== filters.type) return false;
    if (filters.locations?.length && !filters.locations.includes(property.location)) return false;
    if (filters.minPrice && property.price < filters.minPrice) return false;
    if (filters.maxPrice && property.price > filters.maxPrice) return false;
    if (filters.minBeds && property.bedrooms < filters.minBeds) return false;
    if (filters.minBaths && property.bathrooms < filters.minBaths) return false;
    if (filters.furnishingStatus && property.furnishingStatus !== filters.furnishingStatus) return false;
    if (filters.completionStatus && property.completionStatus !== filters.completionStatus) return false;
    if (filters.amenities?.length) {
      return filters.amenities.every(amenity => property.amenities?.includes(amenity));
    }
    return true;
  });

  // Calculate paginated properties
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleAddToListings = async (propertyId: string) => {
    if (!onAddToListings) return;
    try {
      await onAddToListings(propertyId);
      // Remove property from local state after successful addition
      setProperties(prev => prev.filter(p => p.id !== propertyId));
    } catch (err) {
      console.error('Error adding property to listings:', err);
    }
  };

  const handleDeleteClick = (property: Property) => {
    setPropertyToDelete(property);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!propertyToDelete || !agentId) return;

    try {
      setDeletingProperty(propertyToDelete.id);

      if (propertyToDelete.source === 'marketplace') {
        // For marketplace properties, just remove from agent's listings
        const { error } = await supabase
          .from('agent_properties')
          .delete()
          .eq('property_id', propertyToDelete.id)
          .eq('agent_id', agentId);

        if (error) throw error;
      } else {
        // For direct properties, delete the property itself
        const { error } = await supabase
          .from('properties')
          .delete()
          .eq('id', propertyToDelete.id)
          .eq('agent_id', agentId);

        if (error) throw error;
      }

      // Refresh the properties list
      setProperties(prev => prev.filter(p => p.id !== propertyToDelete.id));

      // Call onDelete callback if provided
      onDelete?.(propertyToDelete.id);
    } catch (err) {
      console.error('Error deleting property:', err);
      alert('Failed to delete property. Please try again.');
    } finally {
      setDeletingProperty(null);
      setShowDeleteModal(false);
      setPropertyToDelete(null);
    }
  };

  const handleEditClick = (property: Property) => {
    setPropertyToEdit(property);
    setShowEditModal(true);
  };

  const handleFilterChange = (newFilters: PropertyFilters) => {
    setFilters(newFilters);
  };

  const handlePropertySelect = (property: Property) => {
    // Set flag to allow navigation
    sessionStorage.setItem('intentional_navigation', 'true');
    window.open(`/property/${property.slug || property.id}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (propError) {
    return (
      <div className="text-center text-red-600 p-4">
        {propError}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 pb-24 min-h-screen"> {/* Added min-h-screen and increased padding-bottom */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-wrap justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {onAddToListings ? 'Marketplace Properties' : 'My Properties'}
            </h2>

            {showAddButton && (
              <button
                onClick={() => {
                  // Set flag to allow navigation
                  sessionStorage.setItem('intentional_navigation', 'true');
                  navigate('/dashboard/add-property');
                }}
                className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </button>
            )}
          </div>

          {/* Controls - Responsive layout */}
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-3">
            {/* Sort dropdown - Full width on mobile, auto on larger screens */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="h-11 px-4 bg-gray-100 border-none rounded-lg text-gray-700 hover:bg-gray-200 transition-colors focus:ring-0 focus:outline-none w-full sm:w-auto"
            >
              <option value="default">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>

            {/* Currency selector */}
            <div className="h-11 w-full sm:w-auto">
              <CurrencySelector />
            </div>

            {/* View mode toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1 h-11 w-full sm:w-auto">
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-auto px-4 h-9 rounded-md flex items-center justify-center transition-colors ${
                  viewMode === 'list'
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-4 w-4 mr-2" />
                List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex-1 sm:flex-auto px-4 h-9 rounded-md flex items-center justify-center transition-colors ${
                  viewMode === 'map'
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MapIcon className="h-4 w-4 mr-2" />
                Map
              </button>
            </div>

            {/* Filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-11 px-4 rounded-lg flex items-center justify-center transition-colors w-full sm:w-auto ${
                showFilters
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {showFilters && (
            <div className="lg:col-span-1">
              <PropertyFilterPanel
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={() => setFilters({})}
              />
            </div>
          )}

          <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {viewMode === 'list' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProperties.length > 0 ? (
                  paginatedProperties.map(property => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      source={property.source || 'direct'}
                      onEdit={property.source === 'direct' ? () => handleEditClick(property) : undefined}
                      onDelete={() => handleDeleteClick(property)}
                      onAddToListings={onAddToListings ? () => handleAddToListings(property.id) : undefined}
                      loading={addingProperty === property.id || deletingProperty === property.id}
                      showOriginTag={showOriginTag}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">No properties found matching your filters.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[500px] sm:h-[600px] md:h-[700px] rounded-lg overflow-hidden">
                <PropertyMap
                  properties={paginatedProperties}
                  onPropertySelect={handlePropertySelect}
                />
              </div>
            )}
          </div>
        </div>

        {/* Pagination Controls */}
        {filteredProperties.length > itemsPerPage && (
          <div className="flex justify-center items-center space-x-4 mt-6">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-900'
              }`}
            >
              Previous
            </button>
            <span className="text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-900'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Edit Property Modal */}
      {showEditModal && propertyToEdit && agentId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto m-4">
            {propertyToEdit.source === 'direct' ? (
              <div className="p-4">
                <AgentPropertyForm
                  agentId={agentId}
                  property={propertyToEdit}
                  onSuccess={() => {
                    setShowEditModal(false);
                    setPropertyToEdit(null);
                    // Refresh properties
                    if (onEdit) {
                      onEdit(propertyToEdit.id);
                    }
                  }}
                  onCancel={() => {
                    setShowEditModal(false);
                    setPropertyToEdit(null);
                  }}
                />
              </div>
            ) : (
              <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Edit Marketplace Property</h2>
                <p className="text-gray-600 mb-4">
                  This property is from the marketplace and cannot be edited directly.
                  You can remove it from your listings and add it again if needed.
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setPropertyToEdit(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setPropertyToEdit(null);
                      handleDeleteClick(propertyToEdit);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Remove from Listings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPropertyToDelete(null);
        }}
        onConfirm={handleDelete}
        title={propertyToDelete?.title || ''}
        loading={!!deletingProperty}
      />
    </>
  );
}

