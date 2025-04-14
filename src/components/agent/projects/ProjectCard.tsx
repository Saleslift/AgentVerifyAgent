import React, { useState } from 'react';
import { Calendar, MapPin, Building2, Plus, Check, FileText, ExternalLink, Tag, Layers, ChevronDown, ChevronRight } from 'lucide-react';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { Project, UnitType } from '../../../types';

interface ProjectCardProps {
  project: Project;
  id?: string;
  onAddToMyPage: (projectId: string) => void;
  onAddUnitToProperties: (unitId: string, projectId: string) => void;
  isAddingProject: boolean;
  addingUnitId: string | null;
  unitTypes: UnitType[];
}

export default function ProjectCard({ 
  project, 
  id, 
  onAddToMyPage, 
  onAddUnitToProperties,
  isAddingProject, 
  addingUnitId,
  unitTypes
}: ProjectCardProps) {
  const { formatPrice } = useCurrency();
  const [expanded, setExpanded] = useState(false);
  const [showUnits, setShowUnits] = useState(false);
  const [showPreview, setShowPreview] = useState<{type: 'brochure' | 'floorplan', url: string} | null>(null);

  const handleAddToMyPage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToMyPage(project.id);
  };
  
  const handleAddUnitToProperties = (e: React.MouseEvent, unitId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onAddUnitToProperties(unitId, project.id);
  };

  // Format handover date
  const formattedHandoverDate = new Date(project.handover_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div 
      id={id} 
      className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
    >
      {/* Project Image */}
      <div className="relative aspect-[16/9]">
        <img
          src={project.images[0]}
          alt={project.title}
          className="w-full h-full object-cover"
        />
        
        {/* Developer Logo */}
        {project.developer_logo && (
          <div className="absolute top-3 left-3 bg-white p-1 rounded-lg shadow-md">
            <img 
              src={project.developer_logo} 
              alt={project.developer_name}
              className="w-8 h-8 object-contain"
            />
          </div>
        )}
        
        {/* Project Tags */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {project.is_prelaunch && (
            <span className="px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-full shadow-sm">
              New Launch
            </span>
          )}
        </div>
      </div>
      
      {/* Project Details */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
        
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="text-sm">{project.location}</span>
        </div>
        
        <div className="flex items-center text-gray-600 mb-3">
          <Building2 className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="text-sm">{project.developer_name}</span>
        </div>
        
        <div className="flex items-center text-gray-600 mb-3">
          <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="text-sm">Handover: {formattedHandoverDate}</span>
        </div>
        
        {/* Project Status */}
        <div className="flex items-center mb-3">
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            project.is_prelaunch 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {project.is_prelaunch ? 'Upcoming' : 'Active'}
          </span>
        </div>
        
        {/* Documents */}
        <div className="flex flex-wrap gap-2 mb-3">
          {project.brochure_url && (
            <button
              onClick={() => setShowPreview({type: 'brochure', url: project.brochure_url})}
              className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-gray-200 transition-colors"
            >
              <FileText className="h-3 w-3 mr-1" />
              Brochure
            </button>
          )}
        </div>
        
        <div className="mb-3">
          <div className="text-sm text-gray-500">Price Range</div>
          <div className="font-semibold">
            {formatPrice(project.min_price)} - {formatPrice(project.max_price)}
          </div>
        </div>
        
        <div className="mb-3">
          <div className="text-sm text-gray-500">Size Range</div>
          <div className="font-semibold">
            {project.min_size} - {project.max_size} sqft
          </div>
        </div>
        
        <div className="mb-3">
          <div className="text-sm text-gray-500">Payment Plan</div>
          <div className="font-semibold">{project.payment_plan}</div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-between items-center border-t pt-3 mt-3">
          <button
            onClick={() => setShowUnits(!showUnits)}
            className="text-sm text-black font-medium hover:text-gray-700 flex items-center"
          >
            <Layers className="h-4 w-4 mr-1" />
            {showUnits ? 'Hide Units' : 'Show Units'}
            {showUnits ? <ChevronDown className="h-4 w-4 ml-1" /> : <ChevronRight className="h-4 w-4 ml-1" />}
          </button>
          
          <button
            onClick={handleAddToMyPage}
            disabled={project.added_to_agent_page || isAddingProject}
            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${
              project.added_to_agent_page
                ? 'bg-green-100 text-green-800 cursor-default'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {project.added_to_agent_page ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Added
              </>
            ) : isAddingProject ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </span>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Add to My Page
              </>
            )}
          </button>
        </div>
        
        {/* Unit Types */}
        {showUnits && (
          <div className="mt-4 space-y-3 border-t pt-3">
            <h4 className="font-medium text-gray-800">Available Units</h4>
            {unitTypes.length > 0 ? (
              <div className="space-y-3">
                {unitTypes.map((unit) => (
                  <div 
                    key={unit.id} 
                    className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-gray-300"
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{unit.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        unit.status === 'available' ? 'bg-green-100 text-green-800' :
                        unit.status === 'sold out' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {unit.status === 'available' ? 'Available' : 'Sold out'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                      <div>Size: {unit.size_range}</div>
                      <div>Price: {unit.price_range}</div>
                    </div>
                    
                    <button
                      onClick={(e) => handleAddUnitToProperties(e, unit.id)}
                      disabled={unit.status === 'sold out' || addingUnitId === unit.id}
                      className={`w-full mt-1 inline-flex items-center justify-center px-2 py-1.5 rounded text-xs font-medium ${
                        unit.status === 'sold out'
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : addingUnitId === unit.id
                            ? 'bg-gray-200 text-gray-500'
                            : 'bg-black text-white hover:bg-gray-800'
                      }`}
                    >
                      {addingUnitId === unit.id ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-1" />
                          Add to My Properties
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No unit types available for this project</p>
            )}
          </div>
        )}
      </div>
      
      {/* Document Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">
                {showPreview.type === 'brochure' ? 'Project Brochure' : 'Floor Plans'}
              </h3>
              <div className="flex items-center space-x-2">
                <a 
                  href={showPreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
                <button 
                  onClick={() => setShowPreview(null)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe 
                src={showPreview.url}
                className="w-full h-full"
                title={showPreview.type === 'brochure' ? 'Project Brochure' : 'Floor Plans'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}