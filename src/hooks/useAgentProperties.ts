import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Property } from '../types';
import {convertSnakeToCamel} from "../utils/helpers.ts";

export function useAgentProperties(agentId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    let mounted = true;

    async function fetchDirectProperties(agentId: string) {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(p => convertSnakeToCamel(p));
    }

    async function fetchMarketplaceProperties(agentId: string) {
      const { data, error } = await supabase
        .from('agent_properties')
        .select(`
          property_id,
          property:property_id(*)
        `)
        .eq('agent_id', agentId)
        .eq('status', 'active');

      if (error) throw error;

      return (data || [])
        .filter(item => item.property)
        .map(item => convertSnakeToCamel(item.property));
    }

    async function fetchAgentsUnitTypes(agentId: string) {
      const { data, error } = await supabase
        .from('agent_unit_types')
        .select(`
          unit_type:unit_type_id(*)
        `)
        .eq('agent_id', agentId);

      if (error) throw error;

      return (data || [])
        .filter(item => item.unit_type)
        .map(item => convertSnakeToCamel(item.unit_type));
    }

    async function fetchAllProperties() {
      try {
        if (!agentId) {
          setProperties([]);
          setLoading(false);
          return;
        }

        setError(null);

        const [directProperties, marketplaceProperties, unitTypes] = await Promise.all([
          fetchDirectProperties(agentId),
          fetchMarketplaceProperties(agentId),
          fetchAgentsUnitTypes(agentId)
        ]);

        const allProperties = [...directProperties, ...marketplaceProperties, ...unitTypes];
        console.log(unitTypes);
        if (mounted) {
          setProperties(allProperties);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching agent properties:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load properties');
          setProperties([]);
          setLoading(false);
        }
      }
    }

    fetchAllProperties();

    const subscription = supabase
      .channel('agent_properties_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'properties',
          filter: `agent_id=eq.${agentId}`
        },
        () => {
          fetchAllProperties();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [agentId]);

  return { properties, loading, error };
}

