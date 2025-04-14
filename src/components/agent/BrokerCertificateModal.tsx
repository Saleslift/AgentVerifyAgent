import React, { useState, useEffect } from 'react';
import { X, FileText, Download, AlertCircle, Upload } from 'lucide-react';
import { Agent } from '../../types';

interface BrokerCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent;
}

export default function BrokerCertificateModal({ isOpen, onClose, agent }: BrokerCertificateModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Find RERA certificate if available
  const reraCertificate = agent.certifications?.find(cert => cert.is_rera);
  
  // Check if file URL exists and is valid
  useEffect(() => {
    if (!isOpen || !reraCertificate) return;
    
    setLoading(true);
    setError(null);
    
    // Validate the file URL
    const checkFileUrl = async () => {
      try {
        if (!reraCertificate.file_url) {
          throw new Error('Certificate file not found');
        }

        // Add cache-busting parameter to prevent caching issues
        const urlWithTimestamp = `${reraCertificate.file_url}?t=${Date.now()}`;
        
        // Check if the URL is accessible with proper error handling
        const response = await fetch(urlWithTimestamp, { 
          method: 'HEAD',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!response.ok) {
          if (response.status === 400) {
            throw new Error('The certificate file is no longer accessible. Please re-upload the certificate in your profile settings.');
          } else if (response.status === 403) {
            throw new Error('You do not have permission to view this certificate.');
          } else {
            throw new Error(`Unable to access certificate: ${response.status} ${response.statusText}`);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error validating certificate URL:', err);
        setError(err instanceof Error ? err.message : 'The certificate file could not be loaded. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    checkFileUrl();
  }, [isOpen, reraCertificate]);
  
  if (!isOpen) return null;

  const isOwnProfile = agent.id === agent.currentUserId;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="text-xl font-bold flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary-300" />
            Broker Certificate #{agent.registrationNumber}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-5">
          {reraCertificate ? (
            <div className="flex flex-col items-center">
              <div className="w-full bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-semibold">RERA License</h4>
                    <p className="text-sm text-gray-500">License Number: {reraCertificate.rera_number || agent.registrationNumber}</p>
                  </div>
                  {!error && !loading && (
                    <a 
                      href={`${reraCertificate.file_url}?t=${Date.now()}`}
                      download 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-3 py-1.5 bg-black text-white rounded-lg text-sm"
                      aria-label="Download certificate"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </a>
                  )}
                </div>
                
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
                    <p className="mt-4 text-gray-600">Loading certificate...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                    <h4 className="text-xl font-semibold text-gray-700">Certificate Unavailable</h4>
                    <p className="text-gray-500 mt-2 max-w-md">
                      {error}
                    </p>
                    {isOwnProfile && (
                      <a 
                        href="/profile/edit"
                        className="mt-4 flex items-center px-4 py-2 bg-black text-white rounded-lg text-sm"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Update Certificate
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="relative w-full h-[500px] border border-gray-200 rounded-lg overflow-hidden">
                    <object 
                      data={`${reraCertificate.file_url}?t=${Date.now()}`}
                      type="application/pdf"
                      className="w-full h-full"
                      aria-label="RERA Certificate PDF"
                    >
                      <iframe 
                        src={`${reraCertificate.file_url}?t=${Date.now()}`}
                        className="w-full h-full"
                        title="RERA Certificate"
                        onError={() => setError('The certificate file could not be loaded.')}
                      />
                    </object>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <FileText className="h-16 w-16 text-gray-300 mb-4" />
              <h4 className="text-xl font-semibold text-gray-700">Certificate Preview</h4>
              <p className="text-gray-500 mt-2 max-w-md">
                This agent has a broker registration number ({agent.registrationNumber}), but the certificate file is not available for preview.
              </p>
              {isOwnProfile && (
                <a 
                  href="/profile/edit"
                  className="mt-4 flex items-center px-4 py-2 bg-black text-white rounded-lg text-sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Certificate
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}