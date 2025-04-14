import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { ServiceArea } from '../types';

export function useAgentServiceAreas(agentId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);

  const fetchServiceAreas = useCallback(async () => {
    if (!agentId) {
      setServiceAreas([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('agent_service_areas')
        .select('*')
        .eq('agent_id', agentId)
        .order('location');

      if (fetchError) throw fetchError;
      setServiceAreas(data || []);
    } catch (err) {
      console.error('Error fetching service areas:', err);
      setError(err instanceof Error ? err.message : 'Failed to load service areas');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  const addServiceArea = async (location: string) => {
    if (!agentId || !location.trim()) return;

    try {
      setError(null);
      const { error: insertError } = await supabase
        .from('agent_service_areas')
        .insert({
          agent_id: agentId,
          location: location.trim()
        });

      if (insertError) throw insertError;
      await fetchServiceAreas();
    } catch (err) {
      console.error('Error adding service area:', err);
      setError(err instanceof Error ? err.message : 'Failed to add service area');
    }
  };

  const removeServiceArea = async (id: string) => {
    if (!agentId) return;

    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('agent_service_areas')
        .delete()
        .eq('id', id)
        .eq('agent_id', agentId);

      if (deleteError) throw deleteError;
      await fetchServiceAreas();
    } catch (err) {
      console.error('Error removing service area:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove service area');
    }
  };

  useEffect(() => {
    fetchServiceAreas();

    // Set up real-time subscription
    const subscription = supabase
      .channel('agent_service_areas_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_service_areas',
          filter: `agent_id=eq.${agentId}`
        },
        () => {
          fetchServiceAreas();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [agentId, fetchServiceAreas]);

  return {
    serviceAreas,
    loading,
    error,
    addServiceArea,
    removeServiceArea
  };
}