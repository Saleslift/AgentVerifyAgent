import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { Project } from '../types';
import { useCachedQuery } from './useCachedQuery';

export function useAgentProjects(agentId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [addingProjectId, setAddingProjectId] = useState<string | null>(null);
  const [addingUnitId, setAddingUnitId] = useState<string | null>(null);
  const [unitTypes, setUnitTypes] = useState<Record<string, DB_Unit_Types[]>>({});
  const [displayedUnitTypes, setDisplayedUnitTypes] = useState<DB_Agent_Unit_Types[]>([]);

  // Fetch agent's profile to get agency_id
  const { data: agentData, loading: agentLoading, error: agentError } = useCachedQuery(
    async () => {
      if (!agentId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', agentId)
        .single();

      if (error) throw error;
      return data;
    },
    `agent-agency-${agentId}`,
    { enabled: !!agentId }
  );

  const fetchDeveloperAgentContracts = useCallback(async (agency_id: string) => {
    // Get agency-developer contracts with status 'active'
    const { data: contractsData, error: contractsError } = await supabase
        .from('developer_agency_contracts')
        .select(`
          developer_id,
          agency_id
        `)
        .eq('agency_id', agency_id)
        .eq('status', 'active');

    if (contractsError) throw contractsError;

    if (!contractsData || contractsData.length === 0) {
      setProjects([]);
      setLoading(false);
      return;
    }

    // Get developer IDs from contracts
    return [...new Set(contractsData.map(contract => contract.developer_id))];
  }, [agentData?.agency_id]);

  async function fetchDeveloperProfiles(developerIds: string[]) {
    const { data: developerData, error: developerError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', developerIds);

    if (developerError) throw developerError;

    return developerData;
  }

  async function fetchAgentProjects(agentId: string) {
    const { data: agentProjectsData, error: agentProjectsError } = await supabase
        .from('agent_projects')
        .select('project_id')
        .eq('agent_id', agentId);

    if (agentProjectsError) throw agentProjectsError;

    return agentProjectsData;
  }

  async function fetchUnitTypesForProjects(projectIds: string[]) {
    const { data: unitTypesData, error: unitTypesError } = await supabase
        .from('unit_types')
        .select('*')
        .in('project_id', projectIds);

    if (unitTypesError) throw unitTypesError;

    return unitTypesData;
  }

  // Fetch all projects that the agent's agency has contracts with
  const fetchProjects = useCallback(async () => {
    if (!agentId || !agentData?.agency_id) return;

    try {
      setLoading(true);
      setError(null);

     const developerIds = await fetchDeveloperAgentContracts(agentData.agency_id) || [];

      // Get projects created by these developers
      const { data: projectsData, error: projectsError } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          description,
          location,
          price,
          images,
          videos,
          agent_id,
          created_at,
          updated_at,
          creator_type,
          creator_id,
          lat,
          lng,
          handover_date,
          payment_plan,
          brochure_url,
          is_prelaunch
        `)
        .in('creator_id', developerIds)
        .eq('creator_type', 'developer');

      if (projectsError) throw projectsError;

      const agentProjectsData = await fetchAgentProjects(agentId);

      const addedProjectIds = agentProjectsData?.map(p => p.project_id) || [];

      const unitTypesData = await fetchUnitTypesForProjects(projectsData.map(p => p.id));

      // Group unit types by project
      const groupedUnitTypes: Record<string, DB_Unit_Types[]> = {};
      unitTypesData.forEach(unit => {
        if (!groupedUnitTypes[unit.project_id]) {
          groupedUnitTypes[unit.project_id] = [];
        }
        groupedUnitTypes[unit.project_id].push(unit);
      });

      setUnitTypes(groupedUnitTypes);

      const developerData = await fetchDeveloperProfiles(developerIds);

      // Transform the data to match Project type
      const transformedProjects = projectsData.map(project => {
        // Find developer
        const developer = developerData.find(d => d.id === project.creator_id);

        // Calculate min/max price and size from unit types
        const projectUnits = groupedUnitTypes[project.id] || [];

        const prices = projectUnits
          .map(ut => ut.price)
          .filter(price => price && price > 0);

        const sizes = projectUnits
          .map(ut => ut.sqft)
          .filter(sqft => sqft && sqft > 0);

        const minPrice = prices.length > 0 ? Math.min(...prices) : project.price || 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : project.price || 0;

        const minSize = sizes.length > 0 ? Math.min(...sizes.filter((size): size is number => size !== null)) : 0;
        const maxSize = sizes.length > 0 ? Math.max(...sizes.filter((size): size is number => size !== null)) : 0;

        // Get current date plus 1 year as default handover date if not specified
        const defaultHandoverDate = new Date();
        defaultHandoverDate.setFullYear(defaultHandoverDate.getFullYear() + 1);

        return {
          id: project.id,
          title: project.title,
          description: project.description,
          location: project.location,
          developer_name: developer?.full_name || 'Unknown Developer',
          developer_logo: developer?.avatar_url,
          min_price: minPrice,
          max_price: maxPrice,
          min_size: minSize,
          max_size: maxSize,
          handover_date: project.handover_date || defaultHandoverDate.toISOString(),
          payment_plan: project.payment_plan || '40/60',
          images: project.images,
          videos: project.videos || [],
          brochure_url: project.brochure_url,
          is_prelaunch: project.is_prelaunch || false,
          lat: project.lat,
          lng: project.lng,
          unit_types: projectUnits,
          added_to_agent_page: addedProjectIds.includes(project.id)
        };
      });

      setProjects(transformedProjects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [agentId, agentData?.agency_id]);



  // Add project to agent's page
  const addProjectToAgentPage = useCallback(async (projectId: string) => {
    if (!agentId) return;

    try {
      setAddingProjectId(projectId);

      // Check if already added
      const { data: existing, error: checkError } = await supabase
        .from('agent_projects')
        .select('id')
        .eq('agent_id', agentId)
        .eq('project_id', projectId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        // Already added, just update projects state
        setProjects(prev =>
          prev.map(p =>
            p.id === projectId
              ? { ...p, added_to_agent_page: true }
              : p
          )
        );
        return;
      }

      // Add to agent_projects
      const { error: insertError } = await supabase
        .from('agent_projects')
        .insert({
          agent_id: agentId,
          project_id: projectId,
          created_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Update local state
      setProjects(prev =>
        prev.map(p =>
          p.id === projectId
            ? { ...p, added_to_agent_page: true }
            : p
        )
      );
    } catch (err) {
      console.error('Error adding project to agent page:', err);
      throw err;
    } finally {
      setAddingProjectId(null);
    }
  }, [agentId]);

  /*   AGENT UNIT TYPES */
  const fetchAgentUnitTypes = useCallback(async () => {
    try {
      const { data, error } = await supabase
          .from('agent_unit_types')
          .select('*')
          .eq('agent_id', agentId || '')

      if (error) throw error;

      setDisplayedUnitTypes(data);

    } catch (error) {
      console.error('Error fetching agent unit types:', error);
      throw error;
    }
  }, [agentId]);

  const removeUnitFromDisplay = async (unitId: string) => {
    if (!agentId) return;

    try {
      setAddingUnitId(unitId);

      // Remove from agent_unit_types
      const { error: deleteError } = await supabase
        .from('agent_unit_types')
        .delete()
        .eq('agent_id', agentId)
        .eq('unit_type_id', unitId);

      if (deleteError) throw deleteError;

      // Update displayed unit types
      setDisplayedUnitTypes(prev => prev.filter(unit => unit.unit_type_id !== unitId));

    } catch (err) {
      console.error('Error removing unit from display:', err);
      throw err;
    } finally {
      setAddingUnitId(null);
    }
  };

  // Add unit to agent's properties
  const addUnitToDisplay = useCallback(async (unitId: string, projectId: string) => {
    if (!agentId) return;

    try {
      setAddingUnitId(unitId);

      // Get unit details
      const { data: unit, error: unitError } = await supabase
        .from('unit_types')
        .select('*')
        .eq('id', unitId)
        .single();

      if (unitError) throw unitError;

      if (unit) {
        const newAgentUnitType = {
          agent_id: agentId,
          unit_type_id: unitId,
          created_at: new Date().toISOString(),
        }

        // Insert the new property
        const { data: agentUnitType, error: insertError } = await supabase
            .from('agent_unit_types')
            .insert(newAgentUnitType)
            .select()
            .single();

        if (insertError) throw insertError;


        // Add to displayed unit types
        setDisplayedUnitTypes(prev => prev.concat(agentUnitType));

        // Also add to agent_projects if not already added
        if (!projects.find(p => p.id === projectId)?.added_to_agent_page) {
          await addProjectToAgentPage(projectId);
        }

        return agentUnitType;
      }

    } catch (err) {
      console.error('Error adding unit to properties:', err);
      throw err;
    } finally {
      setAddingUnitId(null);
    }
  }, [agentId, projects, addProjectToAgentPage]);

  useEffect(() => {
    if (agentData?.agency_id) {
      fetchProjects();
    } else if (!agentLoading && !agentData?.agency_id) {
      setLoading(false);
      setProjects([]);
    }
  }, [agentData?.agency_id, fetchProjects, agentLoading]);


  useEffect(() => {
    if (agentId) {
      fetchAgentUnitTypes();
    }
  }, [agentId]);

  return {
    projects,
    loading: loading || agentLoading,
    error: error || agentError?.message,
    addProjectToAgentPage,
    addingProjectId,
    addingUnitId,
    unitTypes,
    refresh: fetchProjects,
    addUnitToDisplay,
    removeUnitFromDisplay,
    displayedUnitTypes
  };
}
