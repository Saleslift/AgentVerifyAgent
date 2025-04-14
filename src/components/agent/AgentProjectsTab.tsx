import React, { useState, useEffect } from 'react';
import ProjectFilterBar from './projects/ProjectFilterBar';
import ProjectList from './projects/ProjectList';
import ProjectMap from './projects/ProjectMap.tsx';
import { useAgentProjects } from '../../hooks/useAgentProjects';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, Map, List } from 'lucide-react';

export default function AgentProjectsTab() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    unitType: '',
    minSize: '',
    maxSize: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    handoverDate: '',
    paymentPlan: '',
    launchType: ''
  });
  
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  const { 
    projects, 
    loading, 
    error, 
    addProjectToAgentPage,
    addUnitToProperties,
    addingProjectId,
    addingUnitId,
    unitTypes
  } = useAgentProjects(user?.id);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleAddToMyPage = async (projectId) => {
    if (!user) return;
    await addProjectToAgentPage(projectId);
  };
  
  const handleAddUnitToProperties = async (unitId, projectId) => {
    if (!user) return;
    await addUnitToProperties(unitId, projectId);
  };

  // Filter projects based on selected filters
  const filteredProjects = projects.filter(project => {
    // Filter by unit type
    if (filters.unitType && !project.unit_types.some(unit => unit.name.includes(filters.unitType))) {
      return false;
    }
    
    // Filter by min size
    if (filters.minSize && project.min_size < parseInt(filters.minSize)) {
      return false;
    }
    
    // Filter by max size
    if (filters.maxSize && project.max_size > parseInt(filters.maxSize)) {
      return false;
    }
    
    // Filter by min price
    if (filters.minPrice && project.min_price < parseInt(filters.minPrice)) {
      return false;
    }
    
    // Filter by max price
    if (filters.maxPrice && project.max_price > parseInt(filters.maxPrice)) {
      return false;
    }
    
    // Filter by location
    if (filters.location && !project.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    
    // Filter by handover date
    if (filters.handoverDate && new Date(project.handover_date) > new Date(filters.handoverDate)) {
      return false;
    }
    
    // Filter by payment plan
    if (filters.paymentPlan && project.payment_plan !== filters.paymentPlan) {
      return false;
    }
    
    // Filter by launch type
    if (filters.launchType === 'Standard Projects' && project.is_prelaunch) {
      return false;
    }
    
    if (filters.launchType === 'New Launches' && !project.is_prelaunch) {
      return false;
    }
    
    return true;
  });

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Developer Projects</h2>
        
        <div className="flex space-x-2">
          <div className="text-sm text-gray-500 mt-2">
            {projects.length} projects available
          </div>
          
          {/* View mode toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md flex items-center ${
                viewMode === 'list' 
                  ? 'bg-black text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-4 w-4 mr-1" />
              List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-md flex items-center ${
                viewMode === 'map' 
                  ? 'bg-black text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Map className="h-4 w-4 mr-1" />
              Map
            </button>
          </div>
        </div>
      </div>

      <ProjectFilterBar 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
        </div>
      ) : filteredProjects.length > 0 ? (
        viewMode === 'list' ? (
          <ProjectList 
            projects={filteredProjects} 
            onAddToMyPage={handleAddToMyPage}
            onAddUnitToProperties={handleAddUnitToProperties}
            addingProjectId={addingProjectId}
            addingUnitId={addingUnitId}
            unitTypes={unitTypes}
          />
        ) : (
          <div className="h-[600px] rounded-lg overflow-hidden">
            <ProjectMap 
              projects={filteredProjects}
              onProjectClick={(projectId) => {
                // Scroll to the project in the list view
                setViewMode('list');
                setTimeout(() => {
                  const element = document.getElementById(`project-${projectId}`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 100);
              }}
            />
          </div>
        )
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500">
            {projects.length > 0 
              ? 'Try adjusting your filters to see more projects' 
              : 'Your agency doesn\'t have any connected developer projects yet'}
          </p>
        </div>
      )}
    </div>
  );
}