import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  Filter, 
  Search, 
  X, 
  Briefcase, 
  RefreshCw,
  Calendar,
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import DealsList from '../../components/crm/deals/DealsList';
import AddDealModal from '../../components/crm/deals/AddDealModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import AgentSidebar from '../../components/agent/AgentSidebar';

const DealsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('crm');
  
  useEffect(() => {
    if (!user) return;
    fetchDeals();
  }, [user, refreshTrigger]);
  
  const fetchDeals = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('crm_deals')
        .select(`
          *,
          property:property_id(
            id,
            title,
            location,
            price,
            type,
            contract_type,
            images
          ),
          project:project_id(
            id,
            title,
            location
          ),
          lead:lead_id(
            id,
            full_name,
            phone_number,
            email
          ),
          co_agent:co_agent_id(
            id,
            full_name,
            avatar_url
          )
        `)
        .or(`agent_id.eq.${user.id},co_agent_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      setDeals(data || []);
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError('Failed to load deals. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleDealAdded = () => {
    setShowAddDealModal(false);
    handleRefresh();
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setStageFilter('');
    setTypeFilter('');
  };
  
  // Filter deals based on search and filters
  const filteredDeals = deals.filter(deal => {
    // Search term filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      searchTerm === '' || 
      (deal.lead?.full_name?.toLowerCase().includes(searchLower)) ||
      (deal.property?.title?.toLowerCase().includes(searchLower)) ||
      (deal.project?.title?.toLowerCase().includes(searchLower));
      
    // Status filter
    const matchesStatus = statusFilter === '' || deal.status === statusFilter;
    
    // Stage filter (this is based on your schema, adjust if needed)
    let stage = '';
    if (deal.status === 'Draft') stage = 'Initial';
    else if (deal.status === 'In Progress') stage = 'Viewing';
    else if (deal.status === 'Docs Sent') stage = 'Negotiation';
    else if (deal.status === 'Signed') stage = 'MOU';
    else if (deal.status === 'Closed') stage = 'Done';
    
    const matchesStage = stageFilter === '' || stage === stageFilter;
    
    // Type filter
    const dealType = deal.deal_type;
    const isCollaboration = dealType === 'Collaboration' || dealType === 'Marketplace Property';
    const isSolo = dealType === 'Own Property';
    
    const matchesType = 
      typeFilter === '' || 
      (typeFilter === 'Collaboration' && isCollaboration) ||
      (typeFilter === 'Solo' && isSolo);
      
    return matchesSearch && matchesStatus && matchesStage && matchesType;
  });

  return (
    <div className="min-h-screen bg-white">
      <AgentSidebar
        isOpen={false}
        onToggle={() => {}}
        agentId={user?.id}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        agentSlug=""
      />

      <main className="transition-all duration-300 md:ml-[70px] pt-20 md:pt-8 px-4 md:px-8 lg:px-12">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
                <button 
                  onClick={handleRefresh}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                  aria-label="Refresh deals"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>
              
              <button
                onClick={() => setShowAddDealModal(true)}
                className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Add Deal
              </button>
            </div>
            
            {/* Search and Filters */}
            <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by contact name or property"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Docs Sent">Docs Sent</option>
                    <option value="Signed">Signed</option>
                    <option value="Closed">Closed</option>
                    <option value="Lost">Lost</option>
                  </select>
                  
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">All Stages</option>
                    <option value="Initial">Initial</option>
                    <option value="Viewing">Viewing</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="MOU">MOU</option>
                    <option value="Contract">Contract</option>
                    <option value="Done">Done</option>
                  </select>
                  
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="Solo">Solo</option>
                    <option value="Collaboration">Collaboration</option>
                  </select>
                  
                  {(searchTerm || statusFilter || stageFilter || typeFilter) && (
                    <button
                      onClick={resetFilters}
                      className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-800"
                    >
                      <Filter className="h-4 w-4 mr-1" />
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Deals List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : filteredDeals.length > 0 ? (
            <DealsList deals={filteredDeals} onRefresh={handleRefresh} />
          ) : deals.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No matching deals</h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <EmptyState
              icon={<Briefcase className="h-12 w-12" />}
              title="No deals yet"
              message="Start tracking your deals by creating your first one."
              action={{
                label: "Add your first deal",
                onClick: () => setShowAddDealModal(true)
              }}
            />
          )}
          
          {/* Add Deal Modal */}
          <AddDealModal
            isOpen={showAddDealModal}
            onClose={() => setShowAddDealModal(false)}
            onDealAdded={handleDealAdded}
          />
        </div>
      </main>
    </div>
  );
};

export default DealsPage;