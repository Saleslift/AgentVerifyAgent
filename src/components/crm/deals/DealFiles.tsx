import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  FilePlus, 
  X, 
  Upload, 
  Download, 
  Trash2, 
  Loader2,
  Filter,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../utils/supabase';
import LoadingSpinner from '../../LoadingSpinner';
import EmptyState from '../../EmptyState';

interface DealFilesProps {
  dealId: string;
}

const DealFiles: React.FC<DealFilesProps> = ({ dealId }) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [fileType, setFileType] = useState('Contract');
  const [fileCategory, setFileCategory] = useState('other');
  
  // Fetch files when component mounts
  useEffect(() => {
    if (!dealId) return;
    fetchFiles();
    
    // Set up real-time subscription for new files
    const subscription = supabase
      .channel(`deal-files-${dealId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crm_documents',
          filter: `deal_id=eq.${dealId}`
        },
        (payload) => {
          console.log('New file:', payload);
          setFiles(prevFiles => [...prevFiles, payload.new]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'crm_documents',
          filter: `deal_id=eq.${dealId}`
        },
        (payload) => {
          console.log('Deleted file:', payload);
          setFiles(prevFiles => prevFiles.filter(file => file.id !== payload.old.id));
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [dealId]);
  
  // Fetch files
  const fetchFiles = async () => {
    if (!dealId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('crm_documents')
        .select(`
          *,
          uploader:uploaded_by(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      setFiles(data || []);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };
  
  // Show file upload form
  const handleShowUploadForm = () => {
    setShowUploadForm(true);
    setFileToUpload(null);
    setFileType('Contract');
    setUploadProgress(0);
    setError(null);
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setError('File size must be less than 20MB');
        return;
      }
      
      setFileToUpload(file);
      setError(null);
    }
  };
  
  // Upload file
  const handleUpload = async () => {
    if (!dealId || !user || !fileToUpload) return;
    
    try {
      setError(null);
      setUploading(true);
      
      // Generate a unique file name
      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${dealId}/${Date.now()}.${fileExt}`;
      
      // Upload the file to storage
      const { data, error: uploadError } = await supabase.storage
        .from('crm-documents')
        .upload(fileName, fileToUpload, {
          cacheControl: '3600',
          upsert: true,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(Math.round(percent));
          }
        });
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('crm-documents')
        .getPublicUrl(fileName);
      
      // Create a file record in the database
      const { error: insertError } = await supabase
        .from('crm_documents')
        .insert({
          deal_id: dealId,
          name: fileToUpload.name,
          type: fileType,
          file_path: publicUrl,
          file_name: fileName,
          file_size: fileToUpload.size,
          uploaded_by: user.id,
          category: fileCategory
        });
      
      if (insertError) throw insertError;
      
      // Reset the form
      setShowUploadForm(false);
      setFileToUpload(null);
      setUploadProgress(0);
      
      // Log activity
      await supabase
        .from('crm_activities')
        .insert({
          deal_id: dealId,
          agent_id: user.id,
          activity_type: 'Document',
          description: `Uploaded document: ${fileToUpload.name}`
        });
      
      // Fetch files again to update the list
      fetchFiles();
      
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };
  
  // Delete file
  const handleDelete = async (fileId: string, filePath: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }
    
    try {
      // Delete the file record from the database
      const { error: deleteError } = await supabase
        .from('crm_documents')
        .delete()
        .eq('id', fileId);
      
      if (deleteError) throw deleteError;
      
      // Remove from state immediately for UI responsiveness
      setFiles(files.filter(file => file.id !== fileId));
      
      // Log activity
      await supabase
        .from('crm_activities')
        .insert({
          deal_id: dealId,
          agent_id: user.id,
          activity_type: 'Document',
          description: 'Deleted a document'
        });
      
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file');
    }
  };
  
  // Format file size
  const formatFileSize = (size: number): string => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get file icon
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-10 w-10 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-10 w-10 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="h-10 w-10 text-green-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileText className="h-10 w-10 text-purple-500" />;
      default:
        return <FileText className="h-10 w-10 text-gray-500" />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Documents</h2>
        
        <button
          onClick={handleShowUploadForm}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
        >
          <FilePlus className="h-4 w-4 mr-2" />
          Upload File
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* File Upload Form */}
      {showUploadForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Upload Document</h3>
            <button
              onClick={() => setShowUploadForm(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Document Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Type
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="ID">ID/Passport</option>
                <option value="Buyer Passport">Buyer Passport</option>
                <option value="Seller ID">Seller ID</option>
                <option value="MOU">MOU</option>
                <option value="Contract">Contract</option>
                <option value="Payment Receipt">Payment Receipt</option>
              </select>
            </div>
            
            {/* File Category Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={fileCategory}
                onChange={(e) => setFileCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="mou">Memorandum of Understanding</option>
                <option value="contract">Contract</option>
                <option value="id">Identification</option>
                <option value="payment">Payment</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File
              </label>
              
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-black hover:text-gray-700 focus-within:outline-none"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, Word, Excel, JPG, PNG up to 20MB
                  </p>
                </div>
              </div>
              
              {fileToUpload && (
                <div className="mt-2 flex items-center bg-blue-50 p-2 rounded-md">
                  <FileText className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm font-medium">{fileToUpload.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({formatFileSize(fileToUpload.size)})
                  </span>
                </div>
              )}
              
              {uploading && uploadProgress > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-black rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!fileToUpload || uploading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 flex items-center"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Files List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : files.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded By
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getFileIcon(file.name)}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {file.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {file.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {file.uploader?.avatar_url ? (
                          <img 
                            className="h-8 w-8 rounded-full"
                            src={file.uploader.avatar_url}
                            alt={file.uploader.full_name}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {file.uploader?.full_name || 'Unknown User'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(file.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(file.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <a
                          href={file.file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                          download
                        >
                          <Download className="h-5 w-5" />
                        </a>
                        
                        {file.uploaded_by === user?.id && (
                          <button
                            onClick={() => handleDelete(file.id, file.file_path)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="No documents yet"
          message="Upload documents related to this deal to keep track of important files."
          action={{
            label: "Upload First Document",
            onClick: handleShowUploadForm
          }}
        />
      )}
    </div>
  );
};

export default DealFiles;