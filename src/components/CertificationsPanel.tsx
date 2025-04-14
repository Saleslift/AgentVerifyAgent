import React from 'react';
import { Award, FileText, X, Shield } from 'lucide-react';
import { Certification } from '../types';

interface CertificationsPanelProps {
  certifications: Certification[];
  onRemove?: (id: string, fileUrl: string) => void;
  isEditing?: boolean;
}

export default function CertificationsPanel({ certifications, onRemove, isEditing = false }: CertificationsPanelProps) {
  const handleCertificationClick = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      {certifications.map((cert) => (
        <div
          key={cert.id}
          className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <button
            onClick={() => handleCertificationClick(cert.file_url)}
            className="flex items-center flex-1"
          >
            {cert.is_rera ? (
              <Shield className="h-5 w-5 text-primary-300 mr-3" />
            ) : (
              <Award className="h-5 w-5 text-primary-300 mr-3" />
            )}
            <div>
              <span className="font-medium">{cert.name}</span>
              {cert.is_rera && cert.rera_number && (
                <div className="text-sm text-gray-500 mt-1">
                  RERA License: {cert.rera_number}
                </div>
              )}
            </div>
            <FileText className="h-5 w-5 text-gray-400 ml-4" />
          </button>
          {isEditing && onRemove && (
            <button
              onClick={() => onRemove(cert.id, cert.file_url)}
              className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded-full transition-colors ml-4"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      ))}

      {certifications.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No certifications uploaded yet
        </div>
      )}
    </div>
  );
}