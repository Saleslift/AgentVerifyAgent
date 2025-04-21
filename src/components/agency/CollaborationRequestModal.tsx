import React, { useState, useRef } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle, FileText, BuildingIcon } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useUserDataContext } from '../../contexts/UserDataContext';

interface CollaborationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  developerId: string;
  developerName: string;
  projectId?: string;
  projectName?: string;
  onSuccess?: () => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
const ACCEPTED_FILE_FORMATS = ['.pdf', '.doc', '.docx'];

export default function CollaborationRequestModal({
  isOpen,
  onClose,
  developerId,
  developerName,
  projectId,
  projectName,
  onSuccess
}: CollaborationRequestModalProps) {
  const { profile } = useUserDataContext();
  const [signedContractFile, setSignedContractFile] = useState<File | null>(null);
  const [businessLicenseFile, setBusinessLicenseFile] = useState<File | null>(null);
  const [businessRegistrationFile, setBusinessRegistrationFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const signedContractRef = useRef<HTMLInputElement>(null);
  const businessLicenseRef = useRef<HTMLInputElement>(null);
  const businessRegistrationRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setError(null);

    // Validate file format
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ACCEPTED_FILE_FORMATS.some(format => format.includes(fileExt))) {
      setError(`Invalid file format. Please upload a PDF, DOC, or DOCX file.`);
      e.target.value = ''; // Reset the input
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds the maximum limit of 50MB.`);
      e.target.value = ''; // Reset the input
      return;
    }

    // Set the file
    setFile(file);
  };

  const downloadAgreementTemplate = () => {
    // In a real application, this would download an actual template
    // For this example, I'm using a placeholder URL
    const templateUrl = "https://edcsftvorssaojmyfqgs.supabase.co/storage/v1/object/templates/developer-contract-template.pdf";
    
    // Create a temporary anchor element and trigger download
    const a = document.createElement('a');
    a.href = templateUrl;
    a.download = 'developer-contract-template.pdf';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleConfirmSubmit = async () => {
    if (!signedContractFile || !businessLicenseFile || !businessRegistrationFile) {
      setError('Please upload all required documents.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Upload signed contract file
      const signedContractPath = `${profile?.id}/${developerId}/signed-contract-${Date.now()}-${signedContractFile.name}`;
      const { error: signedContractError } = await supabase.storage
        .from('agency-contracts')
        .upload(signedContractPath, signedContractFile, { upsert: false });

      if (signedContractError) throw new Error(`Failed to upload signed contract: ${signedContractError.message}`);

      // Get public URL
      const { data: signedContractData } = supabase.storage
        .from('agency-contracts')
        .getPublicUrl(signedContractPath);
      
      // 2. Upload business license file
      const businessLicensePath = `${profile?.id}/${developerId}/license-${Date.now()}-${businessLicenseFile.name}`;
      const { error: businessLicenseError } = await supabase.storage
        .from('agency-contracts')
        .upload(businessLicensePath, businessLicenseFile, { upsert: false });

      if (businessLicenseError) throw new Error(`Failed to upload business license: ${businessLicenseError.message}`);

      // Get public URL
      const { data: businessLicenseData } = supabase.storage
        .from('agency-contracts')
        .getPublicUrl(businessLicensePath);
        
      // 3. Upload business registration file
      const businessRegistrationPath = `${profile?.id}/${developerId}/registration-${Date.now()}-${businessRegistrationFile.name}`;
      const { error: businessRegistrationError } = await supabase.storage
        .from('agency-contracts')
        .upload(businessRegistrationPath, businessRegistrationFile, { upsert: false });

      if (businessRegistrationError) throw new Error(`Failed to upload business registration: ${businessRegistrationError.message}`);

      // Get public URL
      const { data: businessRegistrationData } = supabase.storage
        .from('agency-contracts')
        .getPublicUrl(businessRegistrationPath);

      // 4. Create collaboration request record
      const { error: insertError } = await supabase
        .from('developer_agency_contracts')
        .insert({
          developer_id: developerId,
          agency_id: profile?.id,
          agency_signed_contract_url: signedContractData.publicUrl,
          agency_license_url: businessLicenseData.publicUrl,
          agency_registration_url: businessRegistrationData.publicUrl,
          status: 'pending',
          notes: projectId ? `Requested for project: ${projectName}` : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        // Check if this is a duplicate error
        if (insertError.message?.includes("duplicate key") || insertError.code === '23505') {
          throw new Error("You already have a collaboration request with this developer. Please check your existing requests.");
        }
        throw new Error(`Failed to create collaboration request: ${insertError.message}`);
      }

      // Success
      setSuccess(true);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 2000);

    } catch (error) {
      console.error('Error submitting collaboration request:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl overflow-auto max-h-[90vh]">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <BuildingIcon className="h-5 w-5 mr-2 text-black" />
              Request Collaboration with {developerName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </div>
          )}

          {success ? (
            <div className="text-center py-8">
              <div className="bg-green-50 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Collaboration Request Submitted</h3>
              <p className="text-gray-600 mb-6">
                Your request has been sent to {developerName}. You will be notified once they review your application.
              </p>
            </div>
          ) : showConfirmation ? (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Confirm Submission</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to submit your collaboration request to {developerName}?
                {projectId && <span className="block mt-2 font-medium">Project: {projectName}</span>}
              </p>
              
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 mb-4">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <p className="font-medium text-gray-900">Signed Contract</p>
                    <p className="text-sm text-gray-500">{signedContractFile?.name}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 mb-4">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <p className="font-medium text-gray-900">Business License</p>
                    <p className="text-sm text-gray-500">{businessLicenseFile?.name}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 mb-6">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <p className="font-medium text-gray-900">Business Registration</p>
                    <p className="text-sm text-gray-500">{businessRegistrationFile?.name}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  You are requesting a collaboration with {developerName}.
                </p>
                <p className="mt-3 text-gray-700">
                  To complete your request, please:
                </p>
                <ol className="list-decimal pl-5 mt-3 space-y-2 text-gray-600">
                  <li>Upload your business license</li>
                  <li>Upload your business registration</li>
                  <li>Download the developer agreement</li>
                  <li>Sign the developer agreement and upload it</li>
                </ol>
                <p className="mt-3 text-gray-600">
                  Once all documents are uploaded, your collaboration request will be sent.
                </p>
                <p className="mt-2 text-gray-600">
                  The collaboration will be completed when the developer signs and uploads the countersigned contract.
                </p>
              </div>

              <div className="space-y-6">
                {/* Developer Agreement Section */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <FileText className="h-5 w-5 text-gray-500 mr-2" />
                    Developer Agreement
                    <span className="text-red-500 ml-1">*</span>
                  </h3>

                  <div className="flex flex-col space-y-4">
                    <button
                      onClick={downloadAgreementTemplate}
                      className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Agreement Template
                    </button>

                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                      <input
                        type="file"
                        ref={signedContractRef}
                        onChange={(e) => handleFileChange(e, setSignedContractFile)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".pdf,.doc,.docx"
                      />
                      <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      {signedContractFile ? (
                        <div className="mt-2">
                          <p className="font-medium text-gray-900">{signedContractFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {(signedContractFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSignedContractFile(null);
                              if (signedContractRef.current) signedContractRef.current.value = '';
                            }}
                            className="mt-2 text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-700 font-medium">Upload Signed Agreement</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Drag and drop or click to browse
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            PDF, DOC, DOCX • Max 50MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Business License */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <FileText className="h-5 w-5 text-gray-500 mr-2" />
                    Business License
                    <span className="text-red-500 ml-1">*</span>
                  </h3>

                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                    <input
                      type="file"
                      ref={businessLicenseRef}
                      onChange={(e) => handleFileChange(e, setBusinessLicenseFile)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept=".pdf,.doc,.docx"
                    />
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    {businessLicenseFile ? (
                      <div className="mt-2">
                        <p className="font-medium text-gray-900">{businessLicenseFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(businessLicenseFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setBusinessLicenseFile(null);
                            if (businessLicenseRef.current) businessLicenseRef.current.value = '';
                          }}
                          className="mt-2 text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-700 font-medium">Upload Business License</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Drag and drop or click to browse
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          PDF, DOC, DOCX • Max 50MB
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Business Registration */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <FileText className="h-5 w-5 text-gray-500 mr-2" />
                    Business Registration
                    <span className="text-red-500 ml-1">*</span>
                  </h3>

                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                    <input
                      type="file"
                      ref={businessRegistrationRef}
                      onChange={(e) => handleFileChange(e, setBusinessRegistrationFile)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept=".pdf,.doc,.docx"
                    />
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    {businessRegistrationFile ? (
                      <div className="mt-2">
                        <p className="font-medium text-gray-900">{businessRegistrationFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(businessRegistrationFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setBusinessRegistrationFile(null);
                            if (businessRegistrationRef.current) businessRegistrationRef.current.value = '';
                          }}
                          className="mt-2 text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-700 font-medium">Upload Business Registration</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Drag and drop or click to browse
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          PDF, DOC, DOCX • Max 50MB
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowConfirmation(true)}
                    disabled={!signedContractFile || !businessLicenseFile || !businessRegistrationFile}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}