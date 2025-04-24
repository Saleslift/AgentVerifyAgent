import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Shield, Award, MapPin, Building, CheckCircle, AlertCircle,
  FileText, Download, Upload, Clock, X, LayoutGrid, List, MessageSquare,
  ExternalLink, ChevronDown, Calendar, RefreshCw
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useUserDataContext } from '../../contexts/UserDataContext';
import Modal from '../Modal';
import CollaborationRequestButton from './CollaborationRequestButton';

interface Developer {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  agency_logo?: string | null;
  location?: string | null;
  verified: boolean;
  introduction?: string | null;
  slug?: string | null;
  whatsapp?: string | null;
  created_at?: string;
  developer_details?: {
    company_name?: string;
    company_address?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
  };
}

interface CollaborationStatus {
  id: string;
  developer_id: string;
  agency_id: string;
  status: string;
  developer_contract_url?: string | null;
  agency_license_url?: string | null;
  agency_signed_contract_url?: string | null;
  agency_registration_url?: string | null;
  created_at: string;
  updated_at: string;
  notes?: string | null;
}

type ViewMode = 'card' | 'list';
type FilterStatus = 'all' | 'request_sent' | 'pending' | 'approved' | 'needs_action';

export default function AgencyDevelopers() {
  const { profile } = useUserDataContext();
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [collaborations, setCollaborations] = useState<{[key: string]: CollaborationStatus}>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null);
  const [showContractDetailsModal, setShowContractDetailsModal] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Set up real-time subscription
  useEffect(() => {
    if (!profile?.id) return;

    // Subscribe to developer_agency_contracts changes
    const subscription = supabase
      .channel('developer_contracts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'developer_agency_contracts',
          filter: `agency_id=eq.${profile.id}`
        },
        () => {
          // Refetch collaborations when changes occur
          fetchCollaborations();
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.id) {
      fetchDevelopers();
      fetchCollaborations();
    }
  }, [profile?.id]);

  const fetchDevelopers = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          avatar_url,
          agency_logo,
          location,
          verified,
          introduction,
          slug,
          whatsapp,
          developer_details,
          created_at
        `)
        .eq('role', 'developer');

      if (error) throw error;

      setDevelopers(data || []);
    } catch (error) {
      console.error('Error fetching developers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollaborations = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('developer_agency_contracts')
        .select('*')
        .eq('agency_id', profile.id);

      if (error) throw error;

      // Convert to map for easier lookup
      const collaborationMap = (data || []).reduce((acc, item) => {
        acc[item.developer_id] = item;
        return acc;
      }, {} as {[key: string]: CollaborationStatus});

      setCollaborations(collaborationMap);
    } catch (error) {
      console.error('Error fetching collaborations:', error);
    }
  };

  const handleCollaborationSuccess = () => {
    fetchCollaborations();
    setUploadSuccess('Collaboration request has been sent successfully! The developer will review your documents and sign the contract.');
  };

  const isLicenseExpired = (collaboration: CollaborationStatus): boolean => {
    if (!collaboration || !collaboration.agency_license_url) return false;

    const createDate = new Date(collaboration.created_at);
    const now = new Date();
    const diffMonths = (now.getFullYear() - createDate.getFullYear()) * 12 + now.getMonth() - createDate.getMonth();

    return diffMonths >= 11;
  };

  const getCollaborationStatus = (developerId: string): { text: string, element: JSX.Element } => {
    const collaboration = collaborations[developerId];
    if (!collaboration) {
      return {
        text: 'Not requested',
        element: (
          <CollaborationRequestButton
            developerId={developerId}
            developerName={developers.find(d => d.id === developerId)?.full_name || "Developer"}
            onSuccess={handleCollaborationSuccess}
          />
        ),
      };
    }

    // Check for license expiry
    const licenseExpired = isLicenseExpired(collaboration);
    if (licenseExpired) {
      return {
        text: 'License renewal required',
        element: (
          <button
            onClick={() => {
              setSelectedDeveloper(developers.find(d => d.id === developerId) || null);
              // Handle license renewal
            }}
            className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Renew License
          </button>
        ),
      };
    }

    switch (collaboration.status) {
      case 'pending':
        return {
          text: 'Pending approval',
          element: (
            <button
              onClick={() => {
                setSelectedDeveloper(developers.find(d => d.id === developerId) || null);
                setShowContractDetailsModal(true);
              }}
              className="w-full px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg flex items-center justify-center cursor-pointer"
            >
              <Clock className="h-4 w-4 mr-2" />
              Pending Approval
            </button>
          ),
        };
      case 'active':
        return {
          text: 'Approved',
          element: (
            <button
              onClick={() => {
                setSelectedDeveloper(developers.find(d => d.id === developerId) || null);
                setShowContractDetailsModal(true);
              }}
              className="w-full px-4 py-2 bg-green-100 text-green-800 rounded-lg flex items-center justify-center cursor-pointer"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approved Partner
            </button>
          ),
        };
      case 'rejected':
        return {
          text: 'Rejected',
          element: (
            <button
              onClick={() => {
                setSelectedDeveloper(developers.find(d => d.id === developerId) || null);
                setShowContractDetailsModal(true);
              }}
              className="w-full px-4 py-2 bg-red-100 text-red-800 rounded-lg flex items-center justify-center cursor-pointer"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Request Rejected
            </button>
          ),
        };
      default:
        return {
          text: 'Unknown',
          element: (
            <button
              onClick={() => {
                setSelectedDeveloper(developers.find(d => d.id === developerId) || null);
                setShowContractDetailsModal(true);
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-lg flex items-center justify-center cursor-pointer"
            >
              Unknown Status
            </button>
          ),
        };
    }
  };

  // Filter developers based on search and status
  const filteredDevelopers = developers.filter(developer => {
    // Search filter
    const matchesSearch =
      developer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      developer.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      developer?.developer_details?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false;

    // Status filter
    if (filterStatus === 'all') return matchesSearch;

    const collaboration = collaborations[developer.id];

    switch (filterStatus) {
      case 'request_sent':
        return matchesSearch && !!collaboration;
      case 'pending':
        return matchesSearch && !!collaboration && collaboration.status === 'pending';
      case 'approved':
        return matchesSearch && !!collaboration && collaboration.status === 'active';
      case 'needs_action':
        return matchesSearch && (
          (!!collaboration && isLicenseExpired(collaboration))
        );
      default:
        return matchesSearch;
    }
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Developers</h1>
          <p className="text-gray-500">Partner with real estate developers and market their projects</p>
        </div>

        {/* View Toggle and Filter */}
        <div className="flex space-x-3">
          <div className="relative">
            <button
              onClick={() => {}}
              className="px-4 py-2 flex items-center space-x-1 border border-gray-300 rounded-lg bg-white text-gray-700"
            >
              <Filter className="h-4 w-4" />
              <span>
                {filterStatus === 'all' && 'All Statuses'}
                {filterStatus === 'request_sent' && 'Request Sent'}
                {filterStatus === 'pending' && 'Pending'}
                {filterStatus === 'approved' && 'Approved'}
                {filterStatus === 'needs_action' && 'Needs Action'}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>

            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 hidden group-focus-within:block">
              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`block px-4 py-2 text-sm text-left w-full ${filterStatus === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`}
                >
                  All Statuses
                </button>
                <button
                  onClick={() => setFilterStatus('request_sent')}
                  className={`block px-4 py-2 text-sm text-left w-full ${filterStatus === 'request_sent' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`}
                >
                  Request Sent
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`block px-4 py-2 text-sm text-left w-full ${filterStatus === 'pending' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilterStatus('approved')}
                  className={`block px-4 py-2 text-sm text-left w-full ${filterStatus === 'approved' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setFilterStatus('needs_action')}
                  className={`block px-4 py-2 text-sm text-left w-full ${filterStatus === 'needs_action' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`}
                >
                  Needs Action
                </button>
              </div>
            </div>
          </div>

          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-black text-white' : 'bg-white text-gray-700'}`}
              aria-label="List view"
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-2 ${viewMode === 'card' ? 'bg-black text-white' : 'bg-white text-gray-700'}`}
              aria-label="Card view"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search developers by name or location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-md text-sm ${
                filterStatus === 'all'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('request_sent')}
              className={`px-3 py-1.5 rounded-md text-sm ${
                filterStatus === 'request_sent'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Request Sent
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-md text-sm ${
                filterStatus === 'pending'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`px-3 py-1.5 rounded-md text-sm ${
                filterStatus === 'approved'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilterStatus('needs_action')}
              className={`px-3 py-1.5 rounded-md text-sm ${
                filterStatus === 'needs_action'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Needs Action
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {uploadSuccess && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm text-green-700">{uploadSuccess}</p>
            </div>
            <button
              className="ml-auto text-green-400 hover:text-green-500"
              onClick={() => setUploadSuccess(null)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Developers Display */}
      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
        </div>
      ) : filteredDevelopers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Building className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No developers found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || filterStatus !== 'all'
              ? "No developers match your current filters."
              : "There are no developers available in the system yet."}
          </p>
          {(searchQuery || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
              }}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === 'card' ? (
        // Card View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevelopers.map(developer => {
            const collaboration = collaborations[developer.id];
            const { element: statusElement } = getCollaborationStatus(developer.id);

            return (
              <div
                key={developer.id}
                onClick={() => {
                  setSelectedDeveloper(developer);
                  if (collaboration) {
                    setShowContractDetailsModal(true);
                  }
                }}
                className={`bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full ${collaboration ? 'cursor-pointer' : ''} transition-shadow hover:shadow-md ${
                  collaboration && isLicenseExpired(collaboration) ? 'border-2 border-yellow-300' : ''
                }`}
              >
                <div className="p-5 flex-grow">
                  <div className="flex items-start gap-4 mb-4">
                    {/* Logo */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {developer.agency_logo ? (
                        <img
                          src={developer.agency_logo}
                          alt={developer.full_name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Building className="w-8 h-8 text-gray-400" />
                      )}
                    </div>

                    {/* Developer Info */}
                    <div className="flex-grow min-w-0">
                      <h3 className="text-lg font-semibold line-clamp-1">
                        {developer?.developer_details?.company_name || developer.full_name}
                      </h3>

                      {developer.location && (
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mr-1" />
                          <span className="truncate">{developer.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {collaboration && isLicenseExpired(collaboration) && (
                    <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-md p-2 mb-4 flex items-center text-sm">
                      <RefreshCw className="h-4 w-4 mr-1.5 flex-shrink-0" />
                      <span>License renewal required</span>
                    </div>
                  )}

                  {/* Collaboration Status */}
                  {collaboration && (
                    <div className="mb-4">
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mr-1.5" />
                        <span>
                          Request sent: {new Date(collaboration.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center text-sm font-medium">
                        <span>Status: </span>
                        {collaboration.status === 'active' && (
                          <span className="ml-2 text-green-600 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Active
                          </span>
                        )}
                        {collaboration.status === 'pending' && (
                          <span className="ml-2 text-blue-600 flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            Pending Developer Approval
                          </span>
                        )}
                        {collaboration.status === 'rejected' && (
                          <span className="ml-2 text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="p-4 bg-gray-50 grid grid-cols-1 gap-2">
                  {developer.whatsapp && (
                    <a
                      href={`https://wa.me/${developer.whatsapp.replace(/\+/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#CEFA05] text-black rounded-lg text-center flex items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      WhatsApp
                    </a>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {developer.slug && (
                      <a
                        href={`/developers/${developer.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-center flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Profile
                      </a>
                    )}

                    {/* Show collaboration button */}
                    <div className="w-full" onClick={(e) => e.stopPropagation()}>
                      {statusElement}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // List View
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Developer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDevelopers.map(developer => {
                  const collaboration = collaborations[developer.id];
                  const { text: statusText } = getCollaborationStatus(developer.id);
                  const licenseExpired = collaboration && isLicenseExpired(collaboration);

                  return (
                    <tr
                      key={developer.id}
                      onClick={() => {
                        setSelectedDeveloper(developer);
                        if (collaboration) {
                          setShowContractDetailsModal(true);
                        }
                      }}
                      className={`hover:bg-gray-50 ${collaboration ? 'cursor-pointer' : ''} transition-colors ${
                        licenseExpired ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                            {developer.agency_logo ? (
                              <img
                                src={developer.agency_logo}
                                alt={developer.full_name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Building className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {developer?.developer_details?.company_name || developer.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {developer.verified && (
                                <span className="inline-flex items-center text-xs text-blue-600">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {developer.location || 'Not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {licenseExpired ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            License Renewal Required
                          </span>
                        ) : (
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            !collaboration ? 'bg-gray-100 text-gray-800' :
                            collaboration.status === 'active' ? 'bg-green-100 text-green-800' :
                            collaboration.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {statusText}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {collaboration ? new Date(collaboration.updated_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2 justify-end" onClick={e => e.stopPropagation()}>
                          {developer.whatsapp && (
                            <a
                              href={`https://wa.me/${developer.whatsapp.replace(/\+/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-900"
                            >
                              <MessageSquare className="h-5 w-5" />
                            </a>
                          )}
                          {developer.slug && (
                            <a
                              href={`/developers/${developer.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <ExternalLink className="h-5 w-5" />
                            </a>
                          )}
                          {!collaboration && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <CollaborationRequestButton
                                developerId={developer.id}
                                developerName={developer.full_name}
                                size="sm"
                                variant="secondary"
                                onSuccess={handleCollaborationSuccess}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contract Details Modal */}
      <Modal
        isOpen={showContractDetailsModal}
        onClose={() => setShowContractDetailsModal(false)}
        title="Collaboration Details"
      >
        {selectedDeveloper && collaborations[selectedDeveloper.id] && (
          <div>
            <div className="mb-6 border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                {selectedDeveloper?.developer_details?.company_name || selectedDeveloper.full_name}
              </h3>

              {selectedDeveloper.location && (
                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{selectedDeveloper.location}</span>
                </div>
              )}

              {selectedDeveloper.whatsapp && (
                <a
                  href={`https://wa.me/${selectedDeveloper.whatsapp.replace(/\+/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 rounded-md bg-[#CEFA05] text-black text-sm"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  WhatsApp
                </a>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Collaboration Status</h4>

                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                        collaborations[selectedDeveloper.id].agency_registration_url ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="ml-2 text-gray-700">Business Registration</span>
                    </div>

                    {collaborations[selectedDeveloper.id].agency_registration_url && (
                      <a
                        href={collaborations[selectedDeveloper.id].agency_registration_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View
                      </a>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                        collaborations[selectedDeveloper.id].agency_license_url ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="ml-2 text-gray-700">Business License</span>
                    </div>

                    {collaborations[selectedDeveloper.id].agency_license_url && (
                      <a
                        href={collaborations[selectedDeveloper.id].agency_license_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View
                      </a>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                        collaborations[selectedDeveloper.id].agency_signed_contract_url ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Upload className="h-4 w-4" />
                      </div>
                      <span className="ml-2 text-gray-700">Signed Contract</span>
                    </div>

                    {collaborations[selectedDeveloper.id].agency_signed_contract_url && (
                      <a
                        href={collaborations[selectedDeveloper.id].agency_signed_contract_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View
                      </a>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                        collaborations[selectedDeveloper.id].developer_contract_url ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Download className="h-4 w-4" />
                      </div>
                      <span className="ml-2 text-gray-700">Developer Signed Contract</span>
                    </div>

                    {collaborations[selectedDeveloper.id].developer_contract_url && (
                      <a
                        href={collaborations[selectedDeveloper.id].developer_contract_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-medium text-gray-900 mb-3">Collaboration Timeline</h4>

                <div className="space-y-4">
                  <div className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div className="w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <div className="h-full w-px bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-6">
                      <p className="text-sm font-medium text-gray-900">All Documents Submitted</p>
                      <p className="text-xs text-gray-500">
                        {new Date(collaborations[selectedDeveloper.id].created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div className={`w-8 h-8 ${
                        collaborations[selectedDeveloper.id].status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        collaborations[selectedDeveloper.id].status === 'active' ? 'bg-green-100 text-green-800' :
                        collaborations[selectedDeveloper.id].status === 'rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100 text-gray-400'
                      } rounded-full flex items-center justify-center`}>
                        {collaborations[selectedDeveloper.id].status === 'pending' && <Clock className="h-4 w-4" />}
                        {collaborations[selectedDeveloper.id].status === 'active' && <CheckCircle className="h-4 w-4" />}
                        {collaborations[selectedDeveloper.id].status === 'rejected' && <AlertCircle className="h-4 w-4" />}
                      </div>
                      <div className="h-full w-px bg-gray-200 flex-1 my-1"></div>
                    </div>
                    <div className="pb-6">
                      <p className="text-sm font-medium text-gray-900">Developer Review</p>
                      <p className="text-xs text-gray-500">
                        {collaborations[selectedDeveloper.id].status === 'pending' ? 'Pending' :
                         collaborations[selectedDeveloper.id].status === 'active' ? 'Approved' :
                         collaborations[selectedDeveloper.id].status === 'rejected' ? 'Rejected' : 'Unknown'}
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div className={`w-8 h-8 ${
                        collaborations[selectedDeveloper.id].developer_contract_url ? 
                        'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                      } rounded-full flex items-center justify-center`}>
                        {collaborations[selectedDeveloper.id].developer_contract_url ?
                          <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Developer Signed Contract</p>
                      <p className="text-xs text-gray-500">
                        {collaborations[selectedDeveloper.id].developer_contract_url ? 'Completed' :
                         collaborations[selectedDeveloper.id].status === 'rejected' ? 'Rejected' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons based on status */}
              <div className="border-t border-gray-200 pt-6 flex justify-end space-x-3">
                {collaborations[selectedDeveloper.id].status === 'active' ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>Collaboration Active</span>
                  </div>
                ) : collaborations[selectedDeveloper.id].status === 'pending' ? (
                  <div className="flex items-center text-blue-600">
                    <Clock className="h-5 w-5 mr-2" />
                    <span>Waiting for developer review</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>Collaboration request rejected</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
