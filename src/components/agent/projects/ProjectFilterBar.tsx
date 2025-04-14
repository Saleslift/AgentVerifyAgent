import React, { useState } from 'react';
import { Filter, X, ChevronDown, Check } from 'lucide-react';

// Define constants for filter options
const unitTypes = ['Studio', '1 Bedroom', '2 Bedroom', '3 Bedroom', '4+ Bedroom', 'Penthouse', 'Townhouse', 'Villa'];
const locations = ['Dubai Marina', 'Downtown Dubai', 'Palm Jumeirah', 'Business Bay', 'Dubai Hills', 'Jumeirah Village Circle'];
const paymentPlans = ['40/60', '50/50', '60/40', '30/70', 'Post-Handover'];
const launchTypes = ['All', 'Standard Projects', 'New Launches'];

interface ProjectFilterBarProps {
  filters: {
    unitType: string;
    minSize: string;
    maxSize: string;
    minPrice: string;
    maxPrice: string;
    location: string;
    handoverDate: string;
    paymentPlan: string;
    launchType: string;
  };
  onFilterChange: (filters: any) => void;
}

export default function ProjectFilterBar({ filters, onFilterChange }: ProjectFilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Track active filters count
  React.useEffect(() => {
    const count = Object.values(filters).filter(Boolean).length;
    setActiveFiltersCount(count);
  }, [filters]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const handleReset = () => {
    onFilterChange({
      unitType: '',
      minSize: '',
      maxSize: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      handoverDate: '',
      paymentPlan: '',
      launchType: ''
    });
  };

  const toggleFilter = () => {
    setShowFilters(!showFilters);
  };

  const clearFilter = (key: string) => {
    onFilterChange({ ...filters, [key]: '' });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 flex justify-between items-center">
        <button
          onClick={toggleFilter}
          className="flex items-center text-gray-700 hover:text-gray-900 font-medium"
        >
          <Filter className="h-5 w-5 mr-2" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-black text-white text-xs rounded-full">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown className={`h-5 w-5 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {activeFiltersCount > 0 && !showFilters && (
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null;
            
            let label = '';
            switch(key) {
              case 'unitType':
                label = `Type: ${value}`;
                break;
              case 'minSize':
                label = `Min Size: ${value} sqft`;
                break;
              case 'maxSize':
                label = `Max Size: ${value} sqft`;
                break;
              case 'minPrice':
                label = `Min Price: ${parseInt(value).toLocaleString()} AED`;
                break;
              case 'maxPrice':
                label = `Max Price: ${parseInt(value).toLocaleString()} AED`;
                break;
              case 'location':
                label = `Location: ${value}`;
                break;
              case 'handoverDate':
                label = `Handover Before: ${new Date(value).toLocaleDateString()}`;
                break;
              case 'paymentPlan':
                label = `Payment Plan: ${value}`;
                break;
              case 'launchType':
                label = `Launch Type: ${value}`;
                break;
              default:
                label = `${key}: ${value}`;
            }
            
            return (
              <div key={key} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                <span>{label}</span>
                <button
                  onClick={() => clearFilter(key)}
                  className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={`Clear ${key} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showFilters && (
        <div className="p-4 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Type
              </label>
              <select
                name="unitType"
                value={filters.unitType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">Any Type</option>
                {unitTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Size Range (sqft)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  name="minSize"
                  placeholder="Min"
                  value={filters.minSize}
                  onChange={handleChange}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <input
                  type="number"
                  name="maxSize"
                  placeholder="Max"
                  value={filters.maxSize}
                  onChange={handleChange}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Range (AED)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  name="minPrice"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={handleChange}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <input
                  type="number"
                  name="maxPrice"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={handleChange}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                name="location"
                value={filters.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">Any Location</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Handover Date (Before)
              </label>
              <input
                type="date"
                name="handoverDate"
                value={filters.handoverDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Plan
              </label>
              <select
                name="paymentPlan"
                value={filters.paymentPlan}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">Any Plan</option>
                {paymentPlans.map(plan => (
                  <option key={plan} value={plan}>{plan}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Launch Type
              </label>
              <select
                name="launchType"
                value={filters.launchType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">All</option>
                {launchTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Applied filters */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (!value) return null;
                
                let label = '';
                switch(key) {
                  case 'unitType':
                    label = `Type: ${value}`;
                    break;
                  case 'minSize':
                    label = `Min Size: ${value} sqft`;
                    break;
                  case 'maxSize':
                    label = `Max Size: ${value} sqft`;
                    break;
                  case 'minPrice':
                    label = `Min Price: ${parseInt(value).toLocaleString()} AED`;
                    break;
                  case 'maxPrice':
                    label = `Max Price: ${parseInt(value).toLocaleString()} AED`;
                    break;
                  case 'location':
                    label = `Location: ${value}`;
                    break;
                  case 'handoverDate':
                    label = `Handover Before: ${new Date(value).toLocaleDateString()}`;
                    break;
                  case 'paymentPlan':
                    label = `Payment Plan: ${value}`;
                    break;
                  case 'launchType':
                    label = `Launch Type: ${value}`;
                    break;
                  default:
                    label = `${key}: ${value}`;
                }
                
                return (
                  <div key={key} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                    <span>{label}</span>
                    <button
                      onClick={() => onFilterChange({ ...filters, [key]: '' })}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
              
              <button
                onClick={handleReset}
                className="text-sm text-blue-600 hover:text-blue-800 py-1 px-2"
              >
                Reset All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}