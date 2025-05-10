import React from 'react';
import ProjectCard from './ProjectCard';
import { Project } from '../../../types';

interface ProjectListProps {
  projects: Project[];
  onAddToMyPage: (projectId: string) => void;
  onAddUnitToDisplay: (unitId: string, projectId: string) => void;
  addingProjectId: string | null;
  addingUnitId: string | null;
  unitTypes: Record<string, DB_Unit_Types[]>;
  displayedUnitTypes: DB_Agent_Unit_Types[];
  removeUnitFromDisplay: (unitId: string) => void;
}

export default function ProjectList(props: ProjectListProps) {
  const {
    projects,
    onAddToMyPage,
    onAddUnitToDisplay,
    addingProjectId,
    addingUnitId,
    unitTypes,
    displayedUnitTypes,
    removeUnitFromDisplay,
  } = props;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map(project => (
        <ProjectCard
          key={project.id}
          id={`project-${project.id}`}
          project={project}
          onAddToMyPage={onAddToMyPage}
          isAddingProject={addingProjectId === project.id}
          addingUnitId={addingUnitId}
          unitTypes={unitTypes[project.id] || project.unit_types || []}
          onAddUnitToDisplay={onAddUnitToDisplay}
          displayedUnitTypes={displayedUnitTypes}
          removeUnitFromDisplay={removeUnitFromDisplay}

        />
      ))}
    </div>
  );
}
