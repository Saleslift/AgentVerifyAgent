import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Map as MapIcon, List } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMarketplace } from '../hooks/useMarketplace';
import { Property, PropertyFilters } from '../types';
import PropertyFilterPanel from './PropertyFilters';
import PropertyMap from './PropertyMap';
import MarketplacePropertyCard from './MarketplacePropertyCard';
import CurrencySelector from './CurrencySelector';

interface MarketplaceTabProps {
  agentId: string;
}

export default function MarketplaceTab({ agentId }: MarketplaceTabProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading, error, properties, addToListings, addingProperty } = useMarketplace(user?.id || '');
  
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');

  // Filter and sort properties
  const filteredProperties = properties.filter(property => {
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
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
      default:
        return 0;
    }
  });

  const handlePropertySelect = (property: Property) => {
    // Set flag to allow navigation
    sessionStorage.setItem('intentional_navigation', 'true');
    window.open(`/property/${property.slug || property.id}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Marketplace Properties
        </h2>
        
        {/* Controls - Responsive layout */}
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-3">
          {/* Sort dropdown - Full width on mobile, auto on larger screens */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-11 px-4 bg-gray-100 border-none rounded-lg text-gray-700 hover:bg-gray-200 transition-colors focus:ring-0 focus:outline-none w-full sm:w-auto"
          >
            <option value="default">Default Sort</option>
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
              onFilterChange={setFilters}
              onReset={() => setFilters({})}
            />
          </div>
        )}
        
        <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
          {viewMode === 'list' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.length > 0 ? (
                filteredProperties.map(property => (
                  <MarketplacePropertyCard
                    key={property.id}
                    property={property}
                    onAddToListings={() => addToListings(property.id)}
                    loading={addingProperty === property.id}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">No marketplace properties available.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[500px] sm:h-[600px] md:h-[700px] rounded-lg overflow-hidden">
              <PropertyMap
                properties={filteredProperties}
                onPropertySelect={handlePropertySelect}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}