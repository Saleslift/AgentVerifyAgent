import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  MessageSquare, 
  FileText, 
  Clock, 
  User, 
  Calendar,
  Bell,
  Users
} from 'lucide-react';
import { supabase } from '../../../utils/supabase';
import LoadingSpinner from '../../LoadingSpinner';
import { useAuth } from '../../../contexts/AuthContext';

interface DealActivityLogProps {
  dealId: string;
}

const DealActivityLog: React.FC<DealActivityLogProps> = ({ dealId }) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const logsContainer = useRef<HTMLDivElement>(null);
  const [agentProfiles, setAgentProfiles] = useState<Record<string, any>>({});
  
  useEffect(() => {
    if (!dealId) return;
    
    fetchActivities();
    
    // Set up real-time subscription for new activities
    const subscription = supabase
      .channel(`deal-activities-${dealId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crm_activities',
          filter: `deal_id=eq.${dealId}`
        },
        (payload) => {
          console.log('New activity:', payload);
          setActivities(prevActivities => [...prevActivities, payload.new]);
          
          // Fetch agent profile if we don't already have it
          if (payload.new.agent_id && !agentProfiles[payload.new.agent_id]) {
            fetchAgentProfile(payload.new.agent_id);
          }
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [dealId]);
  
  // Fetch activities
  const fetchActivities = async () => {
    if (!dealId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch deal activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('crm_activities')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });
      
      if (activitiesError) throw activitiesError;
      
      setActivities(activitiesData || []);
      
      // Fetch agent profiles for each activity
      const agentIds = [...new Set((activitiesData || []).map(activity => activity.agent_id))];
      
      for (const agentId of agentIds) {
        fetchAgentProfile(agentId);
      }
      
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activity timeline');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch a single agent profile
  const fetchAgentProfile = async (agentId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', agentId)
        .single();
        
      if (error) throw error;
      
      setAgentProfiles(prev => ({
        ...prev,
        [agentId]: data
      }));
    } catch (err) {
      console.error(`Error fetching profile for agent ${agentId}:`, err);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
  // Get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message':
      case 'Message':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'file_upload':
      case 'document_upload':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'status_change':
      case 'Status Change':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'signature':
        return <FileText className="h-5 w-5 text-orange-500" />;
      case 'meeting':
        return <Calendar className="h-5 w-5 text-red-500" />;
      case 'Note':
        return <FileText className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-6">Activity Timeline</h2>
      
      <div ref={logsContainer} className="space-y-6">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div key={activity.id} className="relative pl-6 pb-6">
              {/* Vertical line */}
              {index < activities.length - 1 && (
                <div className="absolute left-[10px] top-[28px] bottom-0 w-0.5 bg-gray-200"></div>
              )}
              
              {/* Activity icon */}
              <div className="absolute left-0 top-0 flex items-center justify-center w-5 h-5 rounded-full bg-white z-10">
                {getActivityIcon(activity.activity_type)}
              </div>
              
              {/* Activity content */}
              <div className="ml-4">
                <div className="flex items-center">
                  {/* Agent avatar */}
                  <div className="mr-2">
                    {agentProfiles[activity.agent_id] ? (
                      agentProfiles[activity.agent_id].avatar_url ? (
                        <img 
                          src={agentProfiles[activity.agent_id].avatar_url} 
                          alt={agentProfiles[activity.agent_id].full_name}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-3 w-3 text-gray-500" />
                        </div>
                      )
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-3 w-3 text-gray-500" />
                      </div>
                    )}
                  </div>
                  
                  {/* Agent name */}
                  <span className="font-medium text-gray-900">
                    {agentProfiles[activity.agent_id]?.full_name || 'Unknown User'}
                  </span>
                  
                  {/* Activity time */}
                  <span className="ml-2 text-sm text-gray-500">
                    {formatDate(activity.created_at)}
                  </span>
                </div>
                
                {/* Activity description */}
                <div className="mt-2 pl-8">
                  <div className="text-gray-700 text-sm">
                    {activity.description}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No activity recorded yet for this deal.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealActivityLog;