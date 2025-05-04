import React from 'react';
import { MapPin, Home, Download } from 'lucide-react';

interface DeveloperProjectCardProps {
  project: DB_Properties,
  onOpenModal: (slug: string | null) => void;
}

export default function DeveloperProjectCard({ project, onOpenModal }: DeveloperProjectCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="aspect-video bg-gray-200">
        {project.images && project.images[0] ? (
          <img
            src={project.images[0]}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <Home className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{project.title}</h3>
        <div className="flex items-center text-gray-500 text-sm mb-2">
          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="truncate">{project.location}</span>
        </div>
        <div className="text-xl font-bold mb-2">
          AED {project.price.toLocaleString()}
        </div>
        <p className="text-gray-600 mb-3 line-clamp-2">{project.description}</p>
        <div className="flex space-x-2">
          <a
            href={`/property/${project.slug}`}
            className="flex-1 py-2 text-center bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            View Details
          </a>
          <button
            onClick={() => onOpenModal(project.slug)}
            className="flex items-center justify-center w-1/3 py-2 bg-gray-800 text-white rounded-lg hover:bg-black transition-colors"
          >
            <Download className="h-5 w-5 mr-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
