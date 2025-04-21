import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, Eye, Building, Share2, Users } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { Property } from '../../types';
import { useUserDataContext } from '../../contexts/UserDataContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import AgencyPropertyCard from '../AgencyPropertyCard';
import SharePropertyModal from '../property/SharePropertyModal';

export default function AgencyProperties() {
  const navigate = useNavigate();
  const { profile } = useUserDataContext();
  const { formatPrice } = useCurrency();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterContractType, setFilterContractType] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [propertySharing, setPropertySharing] = useState<{ [key: string]: { count: number, withAll: boolean } }>({});

  const fetchProperties = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      // Get all properties created by this agency
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('creator_id', profile.id)
        .eq('creator_type', 'agency')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match Property type
      const transformedData: Property[] = (data || []).map(p => ({
        ...p,
        id: p.id,
        title: p.title,
        description: p.description,
        type: p.type,
        contractType: p.contract_type,
        price: p.price,
        location: p.location,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        sqft: p.sqft,
        images: p.images || [],
        agentId: p.agent_id,
        shared: p.shared,
        amenities: p.amenities || [],
        furnishingStatus: p.furnishing_status,
        completionStatus: p.completion_status
      }));

      setProperties(transformedData);

      // Fetch sharing information for each property
      await fetchSharingInformation(transformedData.map(p => p.id));

    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSharingInformation = async (propertyIds: string[]) => {
    if (propertyIds.length === 0) return;

    try {
      // Fetch sharing details
      const { data: sharingData, error: sharingError } = await supabase
        .from('properties')
        .select('id, shared_with_all_agents')
        .in('id', propertyIds);

      if (sharingError) throw sharingError;

      // For properties not shared with all, get counts
      const propertiesForAgentCounts = sharingData
        ?.filter(p => !p.shared_with_all_agents)
        .map(p => p.id) || [];

      let agentCounts: { [key: string]: number } = {};

      if (propertiesForAgentCounts.length > 0) {
        const { data: sharesData, error: countsError } = await supabase
          .from('shared_properties')
          .select('property_id, count(*)')
          .in('property_id', propertiesForAgentCounts)
          .eq('shared_by_agency_id', profile?.id)
          .group('property_id');

        if (countsError) throw countsError;

        // Convert to dictionary for easier lookup
        agentCounts = (sharesData || []).reduce((acc, item) => {
          acc[item.property_id] = item.count;
          return acc;
        }, {} as { [key: string]: number });
      }

      // Combine the data
      const sharingInfo = (sharingData || []).reduce((acc, item) => {
        acc[item.id] = {
          withAll: item.shared_with_all_agents,
          count: item.shared_with_all_agents ? 0 : (agentCounts[item.id] || 0)
        };
        return acc;
      }, {} as { [key: string]: { count: number, withAll: boolean } });

      setPropertySharing(sharingInfo);

    } catch (error) {
      console.error('Error fetching sharing information:', error);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [profile?.id]);

  const handleEditProperty = (property: Property) => {
    navigate(`/agency-dashboard/properties/edit/${property.id}`);
  };

  const handleShareProperty = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setShowShareModal(true);
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      // Update local state
      setProperties(prev => prev.filter(p => p.id !== propertyId));
    } catch (error) {
      console.error('Error deleting property:', error);
    }
  };

  const handleShareSuccess = () => {
    // Refresh the sharing information
    if (properties.length > 0) {
      fetchSharingInformation(properties.map(p => p.id));
    }
  };

  // Filter properties
  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          property.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || property.type === filterType;
    const matchesContract = filterContractType === 'all' || property.contractType === filterContractType;

    return matchesSearch && matchesType && matchesContract;
  });

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-300"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold">Properties</h1>

        <Link
          to="/add-property"
          className="flex items-center justify-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add New Property</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by title or location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white"
              >
                <option value="all">All Types</option>
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="House">House</option>
                <option value="Land">Land</option>
                <option value="Town house">Town House</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Townhouse">Townhouse</option>
              </select>
            </div>

            <div>
              <select
                value={filterContractType}
                onChange={(e) => setFilterContractType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white"
              >
                <option value="all">All Contracts</option>
                <option value="Sale">For Sale</option>
                <option value="Rent">For Rent</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Property List */}
      {filteredProperties.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Building className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-500 mb-6">
            {properties.length === 0
              ? "You haven't added any properties yet."
              : "No properties match your current filters."}
          </p>
          {properties.length === 0 && (
            <Link
              to="/add-property"
              className="inline-flex items-center justify-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add Your First Property</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <AgencyPropertyCard
              key={property.id}
              property={property}
              onEdit={() => handleEditProperty(property)}
              onDelete={() => handleDeleteProperty(property.id)}
              onShare={() => handleShareProperty(property.id)}
              showVisibilityBadge={true}
              sharedAgentCount={propertySharing[property.id]?.count || 0}
              isSharedWithAllAgents={propertySharing[property.id]?.withAll || false}
            />
          ))}
        </div>
      )}

      {/* Share Property Modal */}
      {showShareModal && selectedPropertyId && profile?.id && (
        <SharePropertyModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          propertyId={selectedPropertyId}
          agencyId={profile.id}
          onSuccess={handleShareSuccess}
        />
      )}
    </div>
  );
}
