import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { Property } from '../types';

export function useMarketplace(agentId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [addingProperty, setAddingProperty] = useState<string | null>(null);

  // Fetch marketplace properties
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First get the IDs of properties already added by the agent
      const { data: added, error: addedError } = await supabase
        .from('agent_properties')
        .select('property_id')
        .eq('agent_id', agentId)
        .eq('status', 'active');

      if (addedError) {
        console.error('Error fetching added properties:', addedError);
        throw addedError;
      }

      // Get array of added property IDs
      const addedIds = (added || []).map(item => item.property_id);

      // Get marketplace properties excluding already added ones
      const { data: marketplaceProperties, error: marketplaceError } = await supabase
        .from('properties')
        .select(`
          *,
          agent:agent_id(
            full_name,
            avatar_url,
            agency_name
          )
        `)
        .eq('shared', true)
        .neq('agent_id', agentId);

      if (marketplaceError) {
        console.error('Error fetching marketplace properties:', marketplaceError);
        throw marketplaceError;
      }

      // Filter out properties that are already in the agent's listings
      const availableProperties = marketplaceProperties?.filter(
        property => !addedIds.includes(property.id)
      ) || [];

      // Transform the data to match Property type
      const transformedProperties = availableProperties.map(property => ({
        ...property,
        contractType: property.contract_type,
        furnishingStatus: property.furnishing_status,
        completionStatus: property.completion_status,
        floorPlanImage: property.floor_plan_image,
        parkingAvailable: property.parking_available || false,
        agentId: property.agent_id,
        source: 'marketplace' as const
      }));

      setProperties(transformedProperties);
    } catch (err) {
      console.error('Error fetching marketplace properties:', err);
      setError('Failed to load marketplace properties');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  // Add property to listings
  const addToListings = useCallback(async (propertyId: string) => {
    try {
      setAddingProperty(propertyId);

      // Check if already added
      const { data: existing, error: checkError } = await supabase
        .from('agent_properties')
        .select('id')
        .eq('property_id', propertyId)
        .eq('agent_id', agentId)
        .eq('status', 'active')
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        // Property already added - silently remove from view
        setProperties(prev => prev.filter(p => p.id !== propertyId));
        return;
      }

      // Insert into agent_properties
      const { error: insertError } = await supabase
        .from('agent_properties')
        .insert({
          property_id: propertyId,
          agent_id: agentId,
          status: 'active'
        });

      if (insertError) throw insertError;

      // Remove property from view
      setProperties(prev => prev.filter(p => p.id !== propertyId));
    } catch (err) {
      console.error('Error adding property to listings:', err);
      throw err;
    } finally {
      setAddingProperty(null);
    }
  }, [agentId]);

  // Initial fetch
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Set up real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('marketplace_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_properties',
          filter: `agent_id=eq.${agentId}`
        },
        () => {
          fetchProperties();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [agentId, fetchProperties]);

  return {
    loading,
    error,
    properties,
    addingProperty,
    addToListings,
    refresh: fetchProperties
  };
}