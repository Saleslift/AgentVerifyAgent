import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ChevronDown, X, MapPin } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { debounce } from '../utils/helpers';

// Popular Dubai locations for suggestions
const POPULAR_LOCATIONS = [
  'Dubai Marina',
  'Downtown Dubai',
  'Palm Jumeirah',
  'Business Bay',
  'Jumeirah Beach Residence',
  'Dubai Hills Estate',
  'Arabian Ranches',
  'Jumeirah Lake Towers',
  'Jumeirah Village Circle',
  'Dubai Silicon Oasis',
  'Emirates Hills',
  'Al Barsha',
  'Mirdif',
  'Damac Hills',
  'International City',
  'Dubai Sports City',
  'The Springs',
  'The Greens',
  'The Views',
  'Dubai Creek Harbour'
];

// Property types
const PROPERTY_TYPES = [
  { value: '', label: 'All Property Types' },
  { value: 'Apartment', label: 'Apartment' },
  { value: 'Penthouse', label: 'Penthouse' },
  { value: 'Townhouse', label: 'Townhouse' },
  { value: 'Villa', label: 'Villa' },
  { value: 'House', label: 'House' },
  { value: 'Land', label: 'Land' }
];

// Price ranges
const PRICE_RANGES = [
  { value: '', label: 'Any Price' },
  { value: '500000-1000000', label: 'AED 500K - 1M' },
  { value: '1000000-2000000', label: 'AED 1M - 2M' },
  { value: '2000000-5000000', label: 'AED 2M - 5M' },
  { value: '5000000-10000000', label: 'AED 5M - 10M' },
  { value: '10000000+', label: 'AED 10M+' }
];

interface SearchFilterProps {
  onSearch: (filters: {
    propertyType: string;
    priceRange: string;
    location?: string;
  }) => void;
  initialFilters?: {
    propertyType?: string;
    priceRange?: string;
    location?: string;
  };
}

export default function SearchFilter({ onSearch, initialFilters = {} }: SearchFilterProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [propertyType, setPropertyType] = useState(initialFilters.propertyType || '');
  const [priceRange, setPriceRange] = useState(initialFilters.priceRange || '');
  const [locationInput, setLocationInput] = useState(initialFilters.location || '');
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFiltersApplied, setIsFiltersApplied] = useState(false);
  const searchSectionRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const locationCache = useRef<Map<string, string[]>>(new Map());

  // Check if filters are applied
  useEffect(() => {
    setIsFiltersApplied(
      !!propertyType || !!priceRange || !!locationInput
    );
  }, [propertyType, priceRange, locationInput]);

  // Initialize from URL params if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('type');
    const priceParam = params.get('price');
    const locationParam = params.get('location');

    if (typeParam) setPropertyType(typeParam);
    if (priceParam) setPriceRange(priceParam);
    if (locationParam) setLocationInput(locationParam);

    // If any params exist, consider filters as applied
    if (typeParam || priceParam || locationParam) {
      setIsFiltersApplied(true);
    }
  }, [location.search]);

  // Handle click outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced location search
  // const debouncedLocationSearch = useCallback(
  //   debounce((query: string) => {
  //     if (!query.trim()) {
  //       setLocationSuggestions([]);
  //       return;
  //     }
  //
  //     // Check cache first
  //     if (locationCache.current.has(query.toLowerCase())) {
  //       setLocationSuggestions(locationCache.current.get(query.toLowerCase()) || []);
  //       return;
  //     }
  //
  //     // Fuzzy search implementation
  //     const results = POPULAR_LOCATIONS.filter(loc => {
  //       return loc.toLowerCase().includes(query.toLowerCase());
  //     }).slice(0, 10); // Limit to 10 results
  //
  //     // Cache the results
  //     locationCache.current.set(query.toLowerCase(), results);
  //     setLocationSuggestions(results);
  //   }, 300),
  //   []
  // );

  // Handle location input change
  // const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const value = e.target.value;
  //   setLocationInput(value);
  //   setShowSuggestions(true);
  //   debouncedLocationSearch(value);
  // };

  // Handle location suggestion selection
  // const handleLocationSelect = (suggestion: string) => {
  //   setLocationInput(suggestion);
  //   setShowSuggestions(false);
  // };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Update URL with search params
    const searchParams = new URLSearchParams();
    if (propertyType) searchParams.set('type', propertyType);
    if (priceRange) searchParams.set('price', priceRange);
    // if (locationInput) searchParams.set('location', locationInput);

    const newUrl = `${location.pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    navigate(newUrl, { replace: true });

    // Scroll to listings section
    const listingsTab = document.querySelector('[data-tab="listings"]');
    if (listingsTab) {
      (listingsTab as HTMLElement).click();

      // Smooth scroll to the listings section
      setTimeout(() => {
        const listingsSection = document.getElementById('listings-section');
        if (listingsSection) {
          listingsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }

    // Pass search filters to parent component
    onSearch({
      propertyType,
      priceRange,
      location: locationInput
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setPropertyType('');
    setPriceRange('');
    setLocationInput('');
    setLocationSuggestions([]);

    // Update URL by removing search params
    navigate(location.pathname, { replace: true });

    // Pass empty filters to parent component
    onSearch({ propertyType: '', priceRange: '', location: '' });
  };

  return (
    <div className="w-full bg-white shadow-md rounded-xl border border-gray-200" ref={searchSectionRef}>
      <div className="container mx-auto px-4 py-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Label */}
            <label className="text-xl font-bold text-gray-900 whitespace-nowrap md:min-w-[220px]">
              Find the best properties in Dubai
            </label>

            {/* Dropdowns in a row */}
            <div className="flex flex-1 flex-col sm:flex-row gap-3">
              {/* Property Type Dropdown */}
              <div className="flex-1 relative">
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-black focus:border-transparent appearance-none"
                >
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
              </div>

              {/* Location Input with Autocomplete */}
              {/*<div className="flex-1 relative">*/}
              {/*  <input*/}
              {/*    type="text"*/}
              {/*    value={locationInput}*/}
              {/*    onChange={handleLocationChange}*/}
              {/*    onFocus={() => setShowSuggestions(true)}*/}
              {/*    placeholder="Enter location"*/}
              {/*    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-black focus:border-transparent"*/}
              {/*  />*/}
              {/*  {locationInput && (*/}
              {/*    <button*/}
              {/*      type="button"*/}
              {/*      onClick={() => {*/}
              {/*        setLocationInput('');*/}
              {/*        setLocationSuggestions([]);*/}
              {/*      }}*/}
              {/*      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"*/}
              {/*    >*/}
              {/*      <X className="h-5 w-5" />*/}
              {/*    </button>*/}
              {/*  )}*/}

              {/*  /!* Location Suggestions *!/*/}
              {/*  {showSuggestions && locationSuggestions.length > 0 && (*/}
              {/*    <div*/}
              {/*      ref={suggestionsRef}*/}
              {/*      className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto"*/}
              {/*    >*/}
              {/*      {locationSuggestions.map((suggestion) => (*/}
              {/*        <button*/}
              {/*          key={suggestion}*/}
              {/*          type="button"*/}
              {/*          onClick={() => handleLocationSelect(suggestion)}*/}
              {/*          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center"*/}
              {/*        >*/}
              {/*          <MapPin className="h-4 w-4 text-gray-400 mr-2" />*/}
              {/*          <span className="truncate">{suggestion}</span>*/}
              {/*        </button>*/}
              {/*      ))}*/}
              {/*    </div>*/}
              {/*  )}*/}
              {/*</div>*/}

              {/* Price Range Dropdown */}
              <div className="sm:w-40 relative">
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-black focus:border-transparent appearance-none"
                >
                  {PRICE_RANGES.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
              </div>

              {/* Search Button */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center whitespace-nowrap flex-1 sm:flex-auto"
                >
                  <Search className="h-5 w-5 mr-2" />
                  <span>Search</span>
                </button>

                {isFiltersApplied && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-3 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                    aria-label="Clear filters"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Applied Filters */}
          {isFiltersApplied && (
            <div className="flex flex-wrap gap-2 pt-2">
              {propertyType && (
                <div className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                  <span>Type: {propertyType}</span>
                  <button
                    type="button"
                    onClick={() => setPropertyType('')}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {priceRange && (
                <div className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                  <span>Price: {PRICE_RANGES.find(r => r.value === priceRange)?.label}</span>
                  <button
                    type="button"
                    onClick={() => setPriceRange('')}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {locationInput && (
                <div className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                  <span>Location: {locationInput}</span>
                  <button
                    type="button"
                    onClick={() => setLocationInput('')}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
