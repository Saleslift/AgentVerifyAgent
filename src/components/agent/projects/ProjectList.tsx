import React from 'react';
import ProjectCard from './ProjectCard';
import { Project, UnitType } from '../../../types';

interface ProjectListProps {
  projects: Project[];
  onAddToMyPage: (projectId: string) => void;
  onAddUnitToProperties: (unitId: string, projectId: string) => void;
  addingProjectId: string | null;
  addingUnitId: string | null;
  unitTypes: Record<string, UnitType[]>;
}

export default function ProjectList({ 
  projects, 
  onAddToMyPage, 
  onAddUnitToProperties,
  addingProjectId,
  addingUnitId,
  unitTypes
}: ProjectListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map(project => (
        <ProjectCard
          key={project.id}
          id={`project-${project.id}`}
          project={project}
          onAddToMyPage={onAddToMyPage}
          onAddUnitToProperties={onAddUnitToProperties}
          isAddingProject={addingProjectId === project.id}
          addingUnitId={addingUnitId}
          unitTypes={unitTypes[project.id] || project.unit_types || []}
        />
      ))}
    </div>
  );
}