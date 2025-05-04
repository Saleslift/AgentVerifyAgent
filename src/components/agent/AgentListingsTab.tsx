import React, { useState, useMemo, useEffect } from 'react';
import { Filter, Map as MapIcon, List } from 'lucide-react';
import { Property, PropertyFilters } from '../../types';
import PropertyCard from '../PropertyCard';
import PropertyFilterPanel from '../PropertyFilters';
import PropertyMap from '../PropertyMap';
import CurrencySelector from '../CurrencySelector';
import { useTranslation } from 'react-i18next';

interface AgentListingsTabProps {
  properties: Property[];
  loading: boolean;
  error: string | null;
  initialFilters?: PropertyFilters;
}

export default function AgentListingsTab({
  properties,
  loading,
  error,
  initialFilters = {}
}: AgentListingsTabProps) {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');

  // Update filters when initialFilters change
  useEffect(() => {
    if (Object.keys(initialFilters).length > 0) {
      setFilters({...initialFilters});
      setShowFilters(true);
    }
  }, [initialFilters]);

  // Filter and sort properties
  const filteredProperties = useMemo(() => {
    // Apply filters
    let filtered = properties.filter(property => {
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
          // Default sort by creation date (newest first)
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
      }
    });

    return filtered;
  }, [properties, filters, sortBy]);

  const handlePropertySelect = (property: Property | DB_Properties) => {
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
    <div>
      <div className="flex flex-col gap-4 mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          {t('listings')}
        </h2>

        {/* Controls - Responsive layout */}
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-3">
          {/* Sort dropdown - Full width on mobile, auto on larger screens */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-11 px-4 bg-gray-100 border-none rounded-lg text-gray-700 hover:bg-gray-200 transition-colors focus:ring-0 focus:outline-none w-full sm:w-auto"
          >
            <option value="default">{t('newestFirst')}</option>
            <option value="price_asc">{t('priceLowToHigh')}</option>
            <option value="price_desc">{t('priceHighToLow')}</option>
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
              {t('list')}
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
              {t('map')}
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
            {showFilters ? t('hideFilters') : t('showFilters')}
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
                   <PropertyCard
                     key={property.id}
                     property={property}
                     // Don't show origin tag on public profile
                     showOriginTag={false}
                   />
                ))
              ) : (
                <div className="col-span-full text-center py-12 border border-gray-200 rounded-lg">
                  <p className="text-gray-500">{t('noPropertiesFound')}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[500px] sm:h-[600px] md:h-[700px] rounded-lg overflow-hidden">
              <PropertyMap
                  initialZoom={5}
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
