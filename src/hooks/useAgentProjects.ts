import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { Project, UnitType } from '../types';
import { useCachedQuery } from './useCachedQuery';
import React from 'react';

export function useAgentProjects(agentId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [addingProjectId, setAddingProjectId] = useState<string | null>(null);
  const [addingUnitId, setAddingUnitId] = useState<string | null>(null);
  const [unitTypes, setUnitTypes] = useState<Record<string, UnitType[]>>({});

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

  // Fetch all projects that the agent's agency has contracts with
  const fetchProjects = useCallback(async () => {
    if (!agentId || !agentData?.agency_id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get agency-developer contracts with status 'active'
      const { data: contractsData, error: contractsError } = await supabase
        .from('developer_agency_contracts')
        .select(`
          developer_id,
          agency_id
        `)
        .eq('agency_id', agentData.agency_id)
        .eq('status', 'active');
        
      if (contractsError) throw contractsError;
      
      if (!contractsData || contractsData.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }
      
      // Get developer IDs from contracts
      const developerIds = [...new Set(contractsData.map(contract => contract.developer_id))];
      
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
      
      // Get developer profiles
      const { data: developerData, error: developerError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', developerIds);
        
      if (developerError) throw developerError;
      
      // Check if agent already has these projects on their page
      const { data: agentProjectsData, error: agentProjectsError } = await supabase
        .from('agent_projects')
        .select('project_id')
        .eq('agent_id', agentId);
        
      if (agentProjectsError) throw agentProjectsError;
      
      const addedProjectIds = agentProjectsData?.map(p => p.project_id) || [];
      
      // Fetch unit types for all projects
      const { data: unitTypesData, error: unitTypesError } = await supabase
        .from('unit_types')
        .select('*')
        .in('project_id', projectsData.map(p => p.id));
        
      if (unitTypesError) throw unitTypesError;
      
      // Group unit types by project
      const groupedUnitTypes: Record<string, UnitType[]> = {};
      unitTypesData.forEach(unit => {
        if (!groupedUnitTypes[unit.project_id]) {
          groupedUnitTypes[unit.project_id] = [];
        }
        groupedUnitTypes[unit.project_id].push({
          id: unit.id,
          name: unit.name,
          size_range: unit.size_range,
          floor_range: unit.floor_range,
          price_range: unit.price_range,
          status: unit.status,
          units_available: unit.units_available
        });
      });
      
      setUnitTypes(groupedUnitTypes);
      
      // Transform the data to match Project type
      const transformedProjects = projectsData.map(project => {
        // Find developer
        const developer = developerData.find(d => d.id === project.creator_id);
        
        // Calculate min/max price and size from unit types
        const projectUnits = groupedUnitTypes[project.id] || [];
        
        const priceRanges = projectUnits
          .map(ut => ut.price_range)
          .filter(pr => pr && pr !== 'Contact for price')
          .map(pr => {
            if (!pr) return { min: 0, max: 0 };
            const [min, max] = pr.split('-').map(p => parseInt(p.replace(/[^0-9]/g, '').trim()));
            return { min: isNaN(min) ? 0 : min, max: isNaN(max) ? 0 : max };
          })
          .filter(pr => pr.min > 0 || pr.max > 0);
          
        const sizeRanges = projectUnits
          .map(ut => ut.size_range)
          .filter(sr => sr && sr !== 'Contact for size')
          .map(sr => {
            if (!sr) return { min: 0, max: 0 };
            const [min, max] = sr.split('-').map(s => parseInt(s.replace(/[^0-9]/g, '').trim()));
            return { min: isNaN(min) ? 0 : min, max: isNaN(max) ? 0 : max };
          })
          .filter(sr => sr.min > 0 || sr.max > 0);
          
        const minPrice = priceRanges.length > 0 
          ? Math.min(...priceRanges.map(pr => pr.min)) 
          : project.price || 0;
          
        const maxPrice = priceRanges.length > 0 
          ? Math.max(...priceRanges.map(pr => pr.max)) 
          : project.price || 0;
          
        const minSize = sizeRanges.length > 0 
          ? Math.min(...sizeRanges.map(sr => sr.min)) 
          : 0;
          
        const maxSize = sizeRanges.length > 0 
          ? Math.max(...sizeRanges.map(sr => sr.max)) 
          : 0;

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

  useEffect(() => {
    if (agentData?.agency_id) {
      fetchProjects();
    } else if (!agentLoading && !agentData?.agency_id) {
      setLoading(false);
      setProjects([]);
    }
  }, [agentData?.agency_id, fetchProjects, agentLoading]);

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

  // Add unit to agent's properties
  const addUnitToProperties = useCallback(async (unitId: string, projectId: string) => {
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
      
      // Get project details
      const { data: project, error: projectError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (projectError) throw projectError;
      
      // Create a new property based on the unit and project
      const newProperty = {
        title: `${unit.name} Unit in ${project.title}`,
        description: `${project.description || 'Beautiful unit'} - ${unit.name} type.`,
        type: project.type || 'Apartment',
        contract_type: 'Sale',
        price: parseInt(unit.price_range?.split('-')[0]?.replace(/[^0-9]/g, '') || '0'),
        location: project.location,
        bedrooms: parseInt(unit.name.match(/(\d+)\s*BR/) ? unit.name.match(/(\d+)\s*BR/)[1] : '0'),
        bathrooms: parseInt(unit.name.match(/(\d+)\s*BR/) ? unit.name.match(/(\d+)\s*BR/)[1] : '0'),
        sqft: parseInt(unit.size_range?.split('-')[0]?.replace(/[^0-9]/g, '') || '0'),
        images: project.images,
        agent_id: agentId,
        creator_id: agentId,
        creator_type: 'agent',
        shared: false,
        handover_date: project.handover_date,
        payment_plan: project.payment_plan,
        furnishing_status: 'Unfurnished',
        completion_status: 'Off-Plan',
        lat: project.lat,
        lng: project.lng
      };
      
      // Insert the new property
      const { data: newPropertyData, error: insertError } = await supabase
        .from('properties')
        .insert(newProperty)
        .select()
        .single();
        
      if (insertError) throw insertError;
      
      // Also add to agent_projects if not already added
      if (!projects.find(p => p.id === projectId)?.added_to_agent_page) {
        await addProjectToAgentPage(projectId);
      }
      
      return newPropertyData;
    } catch (err) {
      console.error('Error adding unit to properties:', err);
      throw err;
    } finally {
      setAddingUnitId(null);
    }
  }, [agentId, projects, addProjectToAgentPage]);

  return {
    projects,
    loading: loading || agentLoading,
    error: error || agentError?.message,
    addProjectToAgentPage,
    addUnitToProperties,
    addingProjectId,
    addingUnitId,
    unitTypes,
    refresh: fetchProjects
  };
}