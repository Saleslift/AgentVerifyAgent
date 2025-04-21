import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Users, WifiOff, RefreshCw } from 'lucide-react';
import { supabase, checkConnection } from '../../utils/supabase';
import { Agent } from '../../types';

interface SharedPropertiesAgentSelectorProps {
  agencyId: string;
  selectedAgentIds: string[];
  onAgentSelect: (agentIds: string[]) => void;
  shareWithAllAgents: boolean;
  onShareWithAllAgentsChange: (shareWithAll: boolean) => void;
}

export default function SharedPropertiesAgentSelector({
  agencyId,
  selectedAgentIds,
  onAgentSelect,
  shareWithAllAgents,
  onShareWithAllAgentsChange
}: SharedPropertiesAgentSelectorProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [agentCount, setAgentCount] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, [agencyId]);

  const fetchAgents = async () => {
    if (!agencyId) return;
    
    try {
      setLoading(true);
      setConnectionError(null);
      
      // Check network connectivity first
      if (!navigator.onLine) {
        setConnectionError('Network connection is offline. Please check your internet connection and try again.');
        return;
      }

      // Verify Supabase connection
      const connectionStatus = await checkConnection();
      if (!connectionStatus.connected) {
        setConnectionError(`Unable to connect to database: ${connectionStatus.error}`);
        return;
      }
      
      // Fetch active agents
      const { data: agentData, error: agentError } = await supabase
        .from('agency_agents')
        .select(`
          id,
          agent:agent_id(
            id,
            full_name,
            email,
            avatar_url,
            whatsapp
          ),
          status,
          created_at
        `)
        .eq('agency_id', agencyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (agentError) throw agentError;
      
      // Transform data
      const transformedAgents: Agent[] = agentData
        ? agentData.map(item => ({
            id: item.agent.id,
            full_name: item.agent.full_name,
            email: item.agent.email,
            avatar_url: item.agent.avatar_url,
            whatsapp: item.agent.whatsapp,
            status: item.status,
            created_at: item.created_at
          }))
        : [];
      
      setAgents(transformedAgents);
      setAgentCount(transformedAgents.length);
    } catch (error) {
      console.error('Error fetching agents:', error);
      setConnectionError(
        error instanceof Error 
          ? `Failed to load agents: ${error.message}` 
          : 'Failed to load agents. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAgentSelect = (agentId: string) => {
    if (selectedAgentIds.includes(agentId)) {
      onAgentSelect(selectedAgentIds.filter(id => id !== agentId));
    } else {
      onAgentSelect([...selectedAgentIds, agentId]);
    }
  };

  const filteredAgents = agents.filter(agent => 
    agent.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    agent.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <input
          id="shareWithAllAgents"
          type="checkbox"
          checked={shareWithAllAgents}
          onChange={(e) => onShareWithAllAgentsChange(e.target.checked)}
          className="h-4 w-4 text-black rounded border-gray-300 focus:ring-black"
        />
        <label htmlFor="shareWithAllAgents" className="text-sm font-medium text-gray-700 flex items-center">
          <Users className="h-4 w-4 mr-1" />
          Share with all agents in my team ({agentCount})
        </label>
      </div>
      
      {!shareWithAllAgents && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search agents"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg"
            />
          </div>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-black mx-auto"></div>
            </div>
          ) : connectionError ? (
            <div className="rounded-lg bg-red-50 p-4 border border-red-100">
              <div className="flex items-center">
                <WifiOff className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-sm text-red-600">{connectionError}</p>
              </div>
              <button 
                onClick={() => fetchAgents()} 
                className="mt-3 flex items-center text-sm font-medium text-red-600 hover:text-red-800"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry Connection
              </button>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {filteredAgents.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {agents.length === 0 ? "No agents found in your team" : "No agents match your search"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAgents.map((agent) => (
                    <div 
                      key={agent.id}
                      onClick={() => handleAgentSelect(agent.id)}
                      className={`flex items-center p-3 rounded-lg cursor-pointer ${
                        selectedAgentIds.includes(agent.id) 
                          ? 'bg-gray-100 border-2 border-black'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center flex-1">
                        <div className="h-8 w-8 flex-shrink-0">
                          {agent.avatar_url ? (
                            <img
                              src={agent.avatar_url}
                              alt={agent.full_name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserPlus className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{agent.full_name}</p>
                          <p className="text-xs text-gray-500 truncate">{agent.email}</p>
                        </div>
                      </div>
                      
                      {selectedAgentIds.includes(agent.id) && (
                        <div className="ml-2">
                          <X
                            className="h-5 w-5 text-gray-400 hover:text-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAgentSelect(agent.id);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="py-2">
            <p className="text-sm text-gray-500">
              {selectedAgentIds.length > 0 ? 
                `${selectedAgentIds.length} agent${selectedAgentIds.length === 1 ? '' : 's'} selected` : 
                'No agents selected'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}