import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Home, 
  User,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  CheckCircle2,
  Trash2,
  ChevronDown,
  Edit,
  X,
  Users,
  DollarSign,
  Save,
  CornerUpRight
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../utils/supabase';
import LoadingSpinner from '../../LoadingSpinner';
import DealActivityLog from './DealActivityLog';
import DealChat from './DealChat';
import DealFiles from './DealFiles';
import DeleteConfirmationModal from '../../DeleteConfirmationModal';
import { useCurrency } from '../../../contexts/CurrencyContext';
import AgentSidebar from '../../agent/AgentSidebar';

const DealDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deal, setDeal] = useState<any | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'files' | 'chat'>('overview');
  const [editMode, setEditMode] = useState(false);
  const [editedDeal, setEditedDeal] = useState<any>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sidebarActiveTab, setSidebarActiveTab] = useState('crm');
  
  useEffect(() => {
    if (!id || !user) return;
    fetchDeal();
  }, [id, user]);
  
  // Fetch the deal details
  const fetchDeal = async () => {
    if (!id || !user) return;
    
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
            images,
            agent_id,
            shared
          ),
          project:project_id(
            id,
            title,
            location,
            agent_id,
            creator_id
          ),
          lead:lead_id(
            id,
            full_name,
            phone_number,
            email,
            language,
            lead_type
          ),
          agent:agent_id(
            id,
            full_name,
            avatar_url,
            whatsapp
          ),
          co_agent:co_agent_id(
            id,
            full_name,
            avatar_url,
            whatsapp
          )
        `)
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (!data) {
        throw new Error('Deal not found');
      }
      
      setDeal(data);
      setEditedDeal({
        status: data.status,
        commissionSplit: data.commission_split,
        notes: data.notes,
        dealValue: data.deal_value
      });
      
      // Check if the current user is the deal owner
      setIsOwner(data.agent_id === user.id);
      
    } catch (err) {
      console.error('Error fetching deal:', err);
      setError(err instanceof Error ? err.message : 'Failed to load deal details');
    } finally {
      setLoading(false);
    }
  };
  
  // Save edited deal
  const handleSave = async () => {
    if (!id || !user || !deal) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const { error: updateError } = await supabase
        .from('crm_deals')
        .update({
          status: editedDeal.status,
          commission_split: editedDeal.commissionSplit,
          notes: editedDeal.notes,
          deal_value: editedDeal.dealValue ? Number(editedDeal.dealValue) : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (updateError) throw updateError;
      
      // Log activity
      await supabase
        .from('crm_activities')
        .insert([
          {
            deal_id: id,
            agent_id: user.id,
            activity_type: 'Status Change',
            description: `Updated deal information`
          }
        ]);
      
      setEditMode(false);
      fetchDeal();
      
    } catch (err) {
      console.error('Error updating deal:', err);
      setError(err instanceof Error ? err.message : 'Failed to update deal');
    } finally {
      setSaving(false);
    }
  };
  
  // Delete deal
  const handleDelete = async () => {
    if (!id || !user) return;
    
    try {
      setDeleting(true);
      
      // Delete the deal
      const { error: deleteError } = await supabase
        .from('crm_deals')
        .delete()
        .eq('id', id);
        
      if (deleteError) throw deleteError;
      
      navigate('/crm/deals');
      
    } catch (err) {
      console.error('Error deleting deal:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete deal');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <AgentSidebar
          isOpen={false}
          onToggle={() => {}}
          agentId={user?.id}
          activeTab={sidebarActiveTab}
          onTabChange={setSidebarActiveTab}
          agentSlug=""
        />
        <main className="transition-all duration-300 md:ml-[70px] pt-20 md:pt-8 px-4 md:px-8 lg:px-12">
          <div className="max-w-[1600px] mx-auto flex justify-center items-center min-h-[60vh]">
            <LoadingSpinner />
          </div>
        </main>
      </div>
    );
  }
  
  if (error || !deal) {
    return (
      <div className="min-h-screen bg-white">
        <AgentSidebar
          isOpen={false}
          onToggle={() => {}}
          agentId={user?.id}
          activeTab={sidebarActiveTab}
          onTabChange={setSidebarActiveTab}
          agentSlug=""
        />
        <main className="transition-all duration-300 md:ml-[70px] pt-20 md:pt-8 px-4 md:px-8 lg:px-12">
          <div className="max-w-[1600px] mx-auto">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error || 'Deal not found'}</p>
                  <div className="mt-4">
                    <button
                      onClick={() => navigate('/crm/deals')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Deals
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  // Get property title, either from property or project
  const propertyTitle = deal.property?.title || deal.project?.title || 'Unnamed Property';
  
  // Get stage based on status
  const getStage = (status: string) => {
    switch(status) {
      case 'Draft': return 'Initial';
      case 'In Progress': return 'Viewing';
      case 'Docs Sent': return 'Negotiation';
      case 'Signed': return 'MOU';
      case 'Closed': return 'Done';
      default: return 'Initial';
    }
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Docs Sent':
        return 'bg-yellow-100 text-yellow-800';
      case 'Signed':
        return 'bg-green-100 text-green-800';
      case 'Closed':
        return 'bg-purple-100 text-purple-800';
      case 'Lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get deal type badge color
  const getDealTypeColor = (dealType: string) => {
    return dealType === 'Own Property' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  return (
    <div className="min-h-screen bg-white">
      <AgentSidebar
        isOpen={false}
        onToggle={() => {}}
        agentId={user?.id}
        activeTab={sidebarActiveTab}
        onTabChange={setSidebarActiveTab}
        agentSlug=""
      />
      <main className="transition-all duration-300 md:ml-[70px] pt-20 md:pt-8 px-4 md:px-8 lg:px-12">
        <div className="max-w-[1600px] mx-auto">
          {/* Back button */}
          <button
            onClick={() => navigate('/crm/deals')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deals
          </button>
          
          {/* Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDealTypeColor(deal.deal_type)}`}>
                    {deal.deal_type === 'Marketplace Property' ? 'Collaboration' : deal.deal_type}
                  </span>
                  
                  {editMode ? (
                    <select
                      value={editedDeal.status}
                      onChange={(e) => setEditedDeal(prev => ({ ...prev, status: e.target.value }))}
                      className="px-2 py-1 rounded-full text-xs font-medium bg-white border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="Draft">Draft</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Docs Sent">Docs Sent</option>
                      <option value="Signed">Signed</option>
                      <option value="Closed">Closed</option>
                      <option value="Lost">Lost</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deal.status)}`}>
                      {deal.status}
                    </span>
                  )}
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{propertyTitle}</h1>
                
                <div className="text-gray-600 mb-2">
                  {deal.lead ? deal.lead.full_name : 'No contact'} • {getStage(deal.status)}
                </div>
                
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  Created on {new Date(deal.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {editMode ? (
                  <>
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center"
                    >
                      {saving ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'activity'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Activity
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'files'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Files
              </button>
              {(deal.deal_type === 'Collaboration' || deal.deal_type === 'Marketplace Property') && (
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'chat'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Chat
                </button>
              )}
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            {activeTab === 'overview' && (
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div>
                    {/* Contact Information */}
                    <div className="mb-8">
                      <h2 className="text-lg font-semibold mb-4 flex items-center">
                        <User className="h-5 w-5 mr-2 text-blue-500" />
                        Contact Information
                      </h2>
                      
                      {deal.lead ? (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 mb-2">{deal.lead.full_name}</h3>
                          <div className="space-y-2">
                            {deal.lead.phone_number && (
                              <p className="text-gray-600 flex items-center">
                                <span className="w-24 text-gray-500">Phone:</span>
                                {deal.lead.phone_number}
                              </p>
                            )}
                            {deal.lead.email && (
                              <p className="text-gray-600 flex items-center">
                                <span className="w-24 text-gray-500">Email:</span>
                                {deal.lead.email}
                              </p>
                            )}
                            {deal.lead.language && (
                              <p className="text-gray-600 flex items-center">
                                <span className="w-24 text-gray-500">Language:</span>
                                {deal.lead.language}
                              </p>
                            )}
                            <p className="text-gray-600 flex items-center">
                              <span className="w-24 text-gray-500">Type:</span>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {deal.lead.lead_type || 'Buyer'}
                              </span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 text-gray-500">
                          No contact information available
                        </div>
                      )}
                    </div>
                    
                    {/* Property Information */}
                    <div className="mb-8">
                      <h2 className="text-lg font-semibold mb-4 flex items-center">
                        <Home className="h-5 w-5 mr-2 text-green-500" />
                        Property Information
                      </h2>
                      
                      {deal.property ? (
                        <div className="bg-gray-50 rounded-lg overflow-hidden">
                          {deal.property.images?.[0] && (
                            <div className="h-48 overflow-hidden">
                              <img 
                                src={deal.property.images[0]} 
                                alt={deal.property.title} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="font-medium text-gray-900 mb-2">{deal.property.title}</h3>
                            <div className="space-y-2">
                              <p className="text-gray-600 flex items-center">
                                <span className="w-24 text-gray-500">Location:</span>
                                {deal.property.location}
                              </p>
                              <p className="text-gray-600 flex items-center">
                                <span className="w-24 text-gray-500">Type:</span>
                                {deal.property.type} ({deal.property.contract_type})
                              </p>
                              <p className="text-gray-600 flex items-center">
                                <span className="w-24 text-gray-500">Price:</span>
                                {formatPrice(deal.property.price)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : deal.project ? (
                        <div className="bg-gray-50 rounded-lg overflow-hidden">
                          <div className="p-4">
                            <h3 className="font-medium text-gray-900 mb-2">{deal.project.title}</h3>
                            <div className="space-y-2">
                              <p className="text-gray-600 flex items-center">
                                <span className="w-24 text-gray-500">Location:</span>
                                {deal.project.location}
                              </p>
                              <p className="text-gray-600 flex items-center">
                                <span className="w-24 text-gray-500">Type:</span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                                  Project
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 text-gray-500">
                          No property information available
                        </div>
                      )}
                    </div>
                    
                    {/* Deal Value & Commission */}
                    <div>
                      <h2 className="text-lg font-semibold mb-4 flex items-center">
                        <DollarSign className="h-5 w-5 mr-2 text-yellow-500" />
                        Deal Value & Commission
                      </h2>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        {editMode ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Deal Value
                              </label>
                              <input
                                type="number"
                                value={editedDeal.dealValue || ''}
                                onChange={(e) => setEditedDeal(prev => ({ ...prev, dealValue: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                placeholder="Enter deal value"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Commission Split
                              </label>
                              <textarea
                                value={editedDeal.commissionSplit || ''}
                                onChange={(e) => setEditedDeal(prev => ({ ...prev, commissionSplit: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                rows={3}
                                placeholder="Describe the commission split arrangement"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-gray-600 flex items-center">
                              <span className="w-24 text-gray-500">Deal Value:</span>
                              {deal.deal_value ? formatPrice(deal.deal_value) : 'Not specified'}
                            </p>
                            
                            {(deal.deal_type === 'Collaboration' || deal.deal_type === 'Marketplace Property') && (
                              <p className="text-gray-600 flex items-baseline">
                                <span className="w-24 text-gray-500">Split:</span>
                                <span className="flex-1">
                                  {deal.commission_split || 'Commission split not specified'}
                                </span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column */}
                  <div>
                    {/* Deal Details */}
                    <div className="mb-8">
                      <h2 className="text-lg font-semibold mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-purple-500" />
                        Deal Details
                      </h2>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-4">
                          <div className="flex flex-col">
                            <span className="text-gray-500 text-sm">Status</span>
                            <div className="mt-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deal.status)}`}>
                                {deal.status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-gray-500 text-sm">Stage</span>
                            <span className="font-medium">{getStage(deal.status)}</span>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-gray-500 text-sm">Deal Type</span>
                            <div className="mt-1 flex items-center">
                              {deal.deal_type === 'Collaboration' || deal.deal_type === 'Marketplace Property' ? (
                                <Users className="h-4 w-4 text-purple-600 mr-1" />
                              ) : deal.deal_type === 'Off-plan Project' ? (
                                <Home className="h-4 w-4 text-green-600 mr-1" />
                              ) : (
                                <Home className="h-4 w-4 text-blue-600 mr-1" />
                              )}
                              <span className="font-medium">
                                {deal.deal_type === 'Marketplace Property' ? 'Collaboration' : deal.deal_type}
                              </span>
                            </div>
                          </div>
                          
                          {/* Partner Agent (for collaborations) */}
                          {(deal.deal_type === 'Collaboration' || deal.deal_type === 'Marketplace Property') && deal.co_agent && (
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-sm">Partner Agent</span>
                              <div className="mt-1 flex items-center">
                                {deal.co_agent.avatar_url ? (
                                  <img 
                                    src={deal.co_agent.avatar_url}
                                    alt={deal.co_agent.full_name}
                                    className="w-8 h-8 rounded-full object-cover mr-2"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                  </div>
                                )}
                                <span className="font-medium">{deal.co_agent.full_name}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Notes */}
                    <div>
                      <h2 className="text-lg font-semibold mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-gray-500" />
                        Notes
                      </h2>
                      
                      {editMode ? (
                        <textarea
                          value={editedDeal.notes || ''}
                          onChange={(e) => setEditedDeal(prev => ({ ...prev, notes: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          rows={6}
                          placeholder="Add notes about this deal..."
                        />
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 min-h-[150px]">
                          {deal.notes ? (
                            <p className="whitespace-pre-wrap text-gray-700">{deal.notes}</p>
                          ) : (
                            <p className="text-gray-500 italic">No notes added yet</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Timeline */}
                    <div className="mt-8">
                      <h2 className="text-lg font-semibold mb-4 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-orange-500" />
                        Timeline
                      </h2>
                      
                      <div className="relative">
                        <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200"></div>
                        
                        {/* Timeline items */}
                        <div className="space-y-4 relative">
                          <div className="flex items-center mb-2">
                            <div className="z-10 flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                              <CheckCircle2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <h3 className="text-sm font-medium">Created</h3>
                              <time className="text-xs text-gray-500">
                                {new Date(deal.created_at).toLocaleDateString()}
                              </time>
                            </div>
                          </div>
                          
                          {deal.status !== 'Draft' && (
                            <div className="flex items-center mb-2">
                              <div className="z-10 flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="ml-4">
                                <h3 className="text-sm font-medium">In Progress</h3>
                                <time className="text-xs text-gray-500">
                                  {deal.in_progress_at ? new Date(deal.in_progress_at).toLocaleDateString() : 'Date not recorded'}
                                </time>
                              </div>
                            </div>
                          )}
                          
                          {(deal.status === 'Docs Sent' || deal.status === 'Signed' || deal.status === 'Closed') && (
                            <div className="flex items-center mb-2">
                              <div className="z-10 flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="ml-4">
                                <h3 className="text-sm font-medium">Documents Sent</h3>
                                <time className="text-xs text-gray-500">
                                  {deal.docs_sent_at ? new Date(deal.docs_sent_at).toLocaleDateString() : 'Date not recorded'}
                                </time>
                              </div>
                            </div>
                          )}
                          
                          {(deal.status === 'Signed' || deal.status === 'Closed') && (
                            <div className="flex items-center mb-2">
                              <div className="z-10 flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="ml-4">
                                <h3 className="text-sm font-medium">Contract Signed</h3>
                                <time className="text-xs text-gray-500">
                                  {new Date(deal.updated_at).toLocaleDateString()}
                                </time>
                              </div>
                            </div>
                          )}
                          
                          {deal.status === 'Closed' && (
                            <div className="flex items-center mb-2">
                              <div className="z-10 flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              </div>
                              <div className="ml-4">
                                <h3 className="text-sm font-medium">Deal Closed</h3>
                                <time className="text-xs text-gray-500">
                                  {new Date(deal.updated_at).toLocaleDateString()}
                                </time>
                              </div>
                            </div>
                          )}
                          
                          {deal.status === 'Lost' && (
                            <div className="flex items-center mb-2">
                              <div className="z-10 flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                                <X className="w-5 h-5 text-red-600" />
                              </div>
                              <div className="ml-4">
                                <h3 className="text-sm font-medium">Deal Lost</h3>
                                <time className="text-xs text-gray-500">
                                  {deal.lost_at ? new Date(deal.lost_at).toLocaleDateString() : new Date(deal.updated_at).toLocaleDateString()}
                                </time>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'activity' && (
              <DealActivityLog dealId={id} />
            )}
            
            {activeTab === 'files' && (
              <DealFiles dealId={id} />
            )}
            
            {activeTab === 'chat' && deal && (
              <DealChat dealId={id} deal={deal} />
            )}
          </div>
          
          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDelete}
            title="deal"
            message="Are you sure you want to delete this deal? This action cannot be undone."
            loading={deleting}
          />
        </div>
      </main>
    </div>
  );
};

export default DealDetail;