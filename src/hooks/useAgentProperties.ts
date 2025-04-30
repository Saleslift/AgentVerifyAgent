import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Property } from '../types';

export function useAgentProperties(agentId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);

    useEffect(() => {
    let mounted = true;

    async function fetchProperties() {
      try {
        if (!agentId) {
          setProperties([]);
          setLoading(false);
          return;
        }

        setError(null);

        // Get all properties owned by the agent
        const { data: directProperties, error: directPropertiesError } = await supabase
          .from('properties')
          .select('*')
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false });

        if (directPropertiesError) throw directPropertiesError;

        // Get marketplace properties added by the agent
        const { data: marketplaceData, error: marketplaceError } = await supabase
          .from('agent_properties')
          .select(`
            property_id,
            property:property_id(*)
          `)
          .eq('agent_id', agentId)
          .eq('status', 'active');

        if (marketplaceError) throw marketplaceError;

        // Get projects added by the agent
        const { data: projectsData, error: projectsError } = await supabase
          .from('agent_projects')
          .select(`
            project_id,
            project:project_id(*)
          `)
          .eq('agent_id', agentId);

        if (projectsError) throw projectsError;

        // Transform marketplace properties
        const marketplaceProperties = marketplaceData
          ? marketplaceData
              .filter(item => item.property) // Filter out any null properties
              .map(item => ({
                ...item.property,
                contractType: item.property.contract_type,
                furnishingStatus: item.property.furnishing_status,
                completionStatus: item.property.completion_status,
                floorPlanImage: item.property.floor_plan_image,
                parkingAvailable: item.property.parking_available || false,
                agentId: item.property.agent_id,
                source: 'marketplace' as const // Keep source for internal tracking, but won't display it
              }))
          : [];

        // Transform direct properties
        const transformedDirectProperties = (directProperties || []).map(p => ({
          ...p,
          contractType: p.contract_type,
          furnishingStatus: p.furnishing_status,
          completionStatus: p.completion_status,
          floorPlanImage: p.floor_plan_image,
          parkingAvailable: p.parking_available || false,
          agentId: p.agent_id,
          source: 'direct' as const // Keep source for internal tracking, but won't display it
        }));

        // Transform project properties
        const projectProperties = projectsData
          ? projectsData
              .filter(item => item.project) // Filter out any null projects
              .map(item => {
                const project = item.project;
                return {
                  id: project.id,
                  title: project.title,
                  description: project.description,
                  type: project.type || 'Apartment',
                  contractType: project.contract_type || 'Sale',
                  price: project.price,
                  location: project.location,
                  images: project.images,
                  agentId: agentId,
                  shared: false,
                  source: 'project' as const, // Keep source for internal tracking, but won't display it
                  developer_name: project.creator_id ? 'Developer' : undefined,
                  handover_date: project.handover_date,
                  payment_plan: project.payment_plan,
                  slug: project.slug
                };
              })
          : [];

        // Combine all properties into a single unified list
        const allProperties = [...transformedDirectProperties, ...marketplaceProperties, ...projectProperties];

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

    fetchProperties();

    // Set up real-time subscription
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
          fetchProperties();
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
