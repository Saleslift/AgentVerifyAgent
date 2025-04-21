import React, { useState, useEffect } from 'react';
import { X, Users } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import SharedPropertiesAgentSelector from '../agency/SharedPropertiesAgentSelector';

interface SharePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  agencyId: string;
  onSuccess?: () => void;
}

export default function SharePropertyModal({
  isOpen,
  onClose,
  propertyId,
  agencyId,
  onSuccess
}: SharePropertyModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [shareWithAllAgents, setShareWithAllAgents] = useState(false);
  const [existingSharedAgents, setExistingSharedAgents] = useState<string[]>([]);
  const [sharingWithAll, setSharingWithAll] = useState(false);

  // Fetch existing shares when modal opens
  useEffect(() => {
    if (isOpen && propertyId) {
      fetchExistingShares();
    }
  }, [isOpen, propertyId]);

  const fetchExistingShares = async () => {
    try {
      setLoading(true);
      
      // First check if we're sharing with all agents
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('shared_with_all_agents')
        .eq('id', propertyId)
        .single();

      if (propertyError) throw propertyError;
      
      setSharingWithAll(propertyData?.shared_with_all_agents || false);
      setShareWithAllAgents(propertyData?.shared_with_all_agents || false);
      
      if (!propertyData?.shared_with_all_agents) {
        // Fetch specific agent shares
        const { data: sharedAgents, error: sharesError } = await supabase
          .from('shared_properties')
          .select('agent_id')
          .eq('property_id', propertyId)
          .eq('shared_by_agency_id', agencyId);

        if (sharesError) throw sharesError;
        
        const agentIds = sharedAgents?.map(share => share.agent_id) || [];
        setSelectedAgentIds(agentIds);
        setExistingSharedAgents(agentIds);
      }
    } catch (error) {
      console.error('Error fetching existing shares:', error);
      setError('Failed to load existing sharing settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if share with all agents has changed
      if (shareWithAllAgents !== sharingWithAll) {
        // Update the property record
        const { error: updateError } = await supabase
          .from('properties')
          .update({
            shared_with_all_agents: shareWithAllAgents
          })
          .eq('id', propertyId);
        
        if (updateError) throw updateError;
      }
      
      if (shareWithAllAgents) {
        // If sharing with all, delete any specific shares
        const { error: deleteError } = await supabase
          .from('shared_properties')
          .delete()
          .eq('property_id', propertyId)
          .eq('shared_by_agency_id', agencyId);
        
        if (deleteError) throw deleteError;
      } else {
        // Sharing with specific agents
        const agentsToAdd = selectedAgentIds.filter(id => !existingSharedAgents.includes(id));
        const agentsToRemove = existingSharedAgents.filter(id => !selectedAgentIds.includes(id));
        
        // Remove agents no longer shared with
        if (agentsToRemove.length > 0) {
          const { error: deleteError } = await supabase
            .from('shared_properties')
            .delete()
            .eq('property_id', propertyId)
            .eq('shared_by_agency_id', agencyId)
            .in('agent_id', agentsToRemove);
          
          if (deleteError) throw deleteError;
        }
        
        // Add new agents to share with
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
      
      // Call success callback
      if (onSuccess) onSuccess();
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error updating property sharing:', error);
      setError('Failed to update sharing settings');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Share Property with Agents
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <SharedPropertiesAgentSelector
              agencyId={agencyId}
              selectedAgentIds={selectedAgentIds}
              onAgentSelect={setSelectedAgentIds}
              shareWithAllAgents={shareWithAllAgents}
              onShareWithAllAgentsChange={setShareWithAllAgents}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⌛</span>
                  Updating...
                </>
              ) : (
                'Save Sharing Settings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}