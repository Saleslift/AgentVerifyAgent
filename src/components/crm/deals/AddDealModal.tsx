import React, { useState, useEffect } from 'react';
import { X, Search, User, Home, FileText, Upload, DollarSign, Users, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../utils/supabase';
import LoadingSpinner from '../../LoadingSpinner';

interface AddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDealAdded: () => void;
}

const AddDealModal: React.FC<AddDealModalProps> = ({ 
  isOpen, 
  onClose, 
  onDealAdded 
}) => {
  const { user } = useAuth();
  
  // Form data state
  const [formData, setFormData] = useState({
    leadId: '',
    propertyId: '',
    projectId: '',
    dealType: 'Own Property',
    coAgentId: '',
    status: 'Draft',
    dealValue: '',
    commissionSplit: '',
    notes: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [searchingLeads, setSearchingLeads] = useState(false);
  const [searchingProperties, setSearchingProperties] = useState(false);
  const [leadSearchTerm, setLeadSearchTerm] = useState('');
  const [propertySearchTerm, setPropertySearchTerm] = useState('');
  const [showPropertyOptions, setShowPropertyOptions] = useState(false);
  const [showLeadOptions, setShowLeadOptions] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  
  // Reset form data when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        leadId: '',
        propertyId: '',
        projectId: '',
        dealType: 'Own Property',
        coAgentId: '',
        status: 'Draft',
        dealValue: '',
        commissionSplit: '',
        notes: ''
      });
      setSelectedLead(null);
      setSelectedProperty(null);
      setFileToUpload(null);
      setError(null);
      fetchLeads();
      fetchProperties();
    }
  }, [isOpen, user]);
  
  // Fetch leads from database
  const fetchLeads = async () => {
    if (!user) return;
    
    try {
      setSearchingLeads(true);
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError('Failed to load contacts');
    } finally {
      setSearchingLeads(false);
    }
  };
  
  // Fetch properties from database
  const fetchProperties = async () => {
    if (!user) return;
    
    try {
      setSearchingProperties(true);
      
      // Fetch own properties
      const { data: ownProperties, error: ownError } = await supabase
        .from('properties')
        .select('*')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });
        
      if (ownError) throw ownError;
      
      // Fetch marketplace properties
      const { data: marketplaceData, error: marketplaceError } = await supabase
        .from('agent_properties')
        .select(`
          property_id,
          property:property_id(*)
        `)
        .eq('agent_id', user.id)
        .eq('status', 'active');
        
      if (marketplaceError) throw marketplaceError;
      
      // Fetch project properties
      const { data: projectsData, error: projectsError } = await supabase
        .from('properties')
        .select('*')
        .eq('creator_type', 'developer')
        .in('type', ['Apartment', 'Penthouse', 'Townhouse', 'Villa'])
        .order('created_at', { ascending: false });
        
      if (projectsError) throw projectsError;
      
      // Transform marketplace properties
      const marketplaceProperties = (marketplaceData || []).map(item => ({
        ...item.property,
        source: 'marketplace'
      }));
      
      // Combine properties
      setProperties([
        ...(ownProperties || []).map(p => ({ ...p, source: 'own' })),
        ...marketplaceProperties
      ]);
      
      // Set projects
      setProjects(projectsData || []);
      
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties');
    } finally {
      setSearchingProperties(false);
    }
  };
  
  // Filter leads by search term
  const filteredLeads = leads.filter(lead => {
    if (!leadSearchTerm) return true;
    const searchLower = leadSearchTerm.toLowerCase();
    return (
      lead.full_name.toLowerCase().includes(searchLower) ||
      (lead.phone_number && lead.phone_number.includes(leadSearchTerm)) ||
      (lead.email && lead.email.toLowerCase().includes(searchLower))
    );
  });
  
  // Filter properties by search term
  const filteredProperties = properties.filter(property => {
    if (!propertySearchTerm) return true;
    const searchLower = propertySearchTerm.toLowerCase();
    return (
      property.title.toLowerCase().includes(searchLower) ||
      property.location.toLowerCase().includes(searchLower)
    );
  });
  
  // Handle property selection
  const handlePropertySelect = (property: any) => {
    setSelectedProperty(property);
    setFormData(prev => ({
      ...prev, 
      propertyId: property.id,
      dealType: property.source === 'marketplace' || property.agent_id !== user?.id 
        ? 'Marketplace Property' 
        : 'Own Property',
      coAgentId: property.source === 'marketplace' || property.agent_id !== user?.id 
        ? property.agent_id 
        : ''
    }));
    setShowPropertyOptions(false);
    
    // Clear project if property is selected
    if (formData.projectId) {
      setFormData(prev => ({
        ...prev,
        projectId: ''
      }));
    }
  };
  
  // Handle project selection
  const handleProjectSelect = (project: any) => {
    setSelectedProperty(project);
    setFormData(prev => ({
      ...prev, 
      projectId: project.id,
      dealType: 'Off-plan Project',
      propertyId: ''
    }));
    setShowPropertyOptions(false);
  };
  
  // Handle lead selection
  const handleLeadSelect = (lead: any) => {
    setSelectedLead(lead);
    setFormData(prev => ({ ...prev, leadId: lead.id }));
    setShowLeadOptions(false);
  };
  
  // Handle file upload for commission split
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileToUpload(file);
    }
  };
  
  // Create a new deal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Validate form data
      if (!formData.leadId) {
        throw new Error('Please select a contact');
      }
      
      if (!formData.propertyId && !formData.projectId) {
        throw new Error('Please select a property or project');
      }
      
      // Create the deal
      const { data: newDeal, error: dealError } = await supabase
        .from('crm_deals')
        .insert([
          {
            lead_id: formData.leadId,
            property_id: formData.propertyId || null,
            project_id: formData.projectId || null,
            agent_id: user.id,
            co_agent_id: formData.coAgentId || null,
            deal_type: formData.dealType,
            status: formData.status,
            deal_value: formData.dealValue ? Number(formData.dealValue) : null,
            commission_split: formData.commissionSplit,
            notes: formData.notes,
          }
        ])
        .select()
        .single();
        
      if (dealError) throw dealError;
      
      // Upload commission split file if provided
      if (fileToUpload && newDeal) {
        const fileExt = fileToUpload.name.split('.').pop();
        const fileName = `${user.id}/${newDeal.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('crm-documents')
          .upload(fileName, fileToUpload);
          
        if (uploadError) throw uploadError;
        
        // Get file URL
        const { data: fileData } = supabase.storage
          .from('crm-documents')
          .getPublicUrl(fileName);
          
        // Create document record
        await supabase
          .from('crm_documents')
          .insert([
            {
              deal_id: newDeal.id,
              type: 'Contract',
              file_path: fileData.publicUrl,
              file_name: fileToUpload.name,
              file_size: fileToUpload.size,
              uploaded_by: user.id
            }
          ]);
      }
      
      // Log activity
      await supabase
        .from('crm_activities')
        .insert([
          {
            deal_id: newDeal.id,
            agent_id: user.id,
            activity_type: 'Note',
            description: 'Deal created'
          }
        ]);
      
      // Close modal and refresh deals list
      onDealAdded();
      
    } catch (err) {
      console.error('Error creating deal:', err);
      setError(err instanceof Error ? err.message : 'Failed to create deal');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add New Deal</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {error && (
            <div className="mb-5 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
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
          
          <form onSubmit={handleSubmit}>
            {/* Contact Selection */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={leadSearchTerm}
                  onChange={(e) => {
                    setLeadSearchTerm(e.target.value);
                    setShowLeadOptions(true);
                  }}
                  onClick={() => setShowLeadOptions(true)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
                
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                
                {/* Selected contact display */}
                {selectedLead && (
                  <div className="mt-2 flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <div>
                      <p className="font-medium">{selectedLead.full_name}</p>
                      <p className="text-sm text-gray-500">{selectedLead.phone_number}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLead(null);
                        setFormData(prev => ({ ...prev, leadId: '' }));
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
                
                {/* Contact search results */}
                {showLeadOptions && filteredLeads.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200">
                    {filteredLeads.map(lead => (
                      <div
                        key={lead.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleLeadSelect(lead)}
                      >
                        <div className="font-medium">{lead.full_name}</div>
                        <div className="text-sm text-gray-500 flex justify-between">
                          <span>{lead.phone_number}</span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                            {lead.lead_type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* No results message */}
                {showLeadOptions && leadSearchTerm && filteredLeads.length === 0 && !searchingLeads && (
                  <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 p-4 text-center">
                    <p className="text-gray-500">No contacts found</p>
                  </div>
                )}
                
                {/* Loading indicator */}
                {searchingLeads && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Property Selection */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Property or Project</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={propertySearchTerm}
                  onChange={(e) => {
                    setPropertySearchTerm(e.target.value);
                    setShowPropertyOptions(true);
                  }}
                  onClick={() => setShowPropertyOptions(true)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
                
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                
                {/* Selected property display */}
                {selectedProperty && (
                  <div className="mt-2 flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center flex-1">
                      {selectedProperty.images?.[0] ? (
                        <img 
                          src={selectedProperty.images[0]} 
                          alt={selectedProperty.title} 
                          className="w-12 h-12 object-cover rounded mr-3"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center mr-3">
                          <Home className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{selectedProperty.title}</p>
                        <p className="text-sm text-gray-500">{selectedProperty.location}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProperty(null);
                        setFormData(prev => ({ 
                          ...prev, 
                          propertyId: '', 
                          projectId: '',
                          dealType: 'Own Property',
                          coAgentId: '' 
                        }));
                      }}
                      className="text-gray-400 hover:text-gray-600 ml-2"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
                
                {/* Property search results */}
                {showPropertyOptions && (
                  <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200">
                    {/* Properties section */}
                    {filteredProperties.length > 0 && (
                      <div>
                        <div className="sticky top-0 bg-gray-50 px-4 py-2 font-medium text-gray-700">
                          Properties
                        </div>
                        {filteredProperties.map(property => (
                          <div
                            key={property.id}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handlePropertySelect(property)}
                          >
                            <div className="flex justify-between">
                              <div className="font-medium">{property.title}</div>
                              <span className={`text-xs ${property.source === 'marketplace' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'} px-2 py-0.5 rounded-full`}>
                                {property.source === 'marketplace' ? 'Marketplace' : 'Own'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {property.location}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Projects section */}
                    {projects.length > 0 && (
                      <div>
                        <div className="sticky top-0 bg-gray-50 px-4 py-2 font-medium text-gray-700">
                          Projects
                        </div>
                        {projects
                          .filter(project => 
                            !propertySearchTerm || 
                            project.title.toLowerCase().includes(propertySearchTerm.toLowerCase()) ||
                            project.location.toLowerCase().includes(propertySearchTerm.toLowerCase())
                          )
                          .slice(0, 5)
                          .map(project => (
                            <div
                              key={project.id}
                              className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
                              onClick={() => handleProjectSelect(project)}
                            >
                              <div className="flex justify-between">
                                <div className="font-medium">{project.title}</div>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                  Project
                                </span>
                              </div>
                              <div className="text-sm text-gray-500">
                                {project.location}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                    
                    {/* No results message */}
                    {propertySearchTerm && 
                     filteredProperties.length === 0 && 
                     projects.filter(p => 
                       p.title.toLowerCase().includes(propertySearchTerm.toLowerCase()) || 
                       p.location.toLowerCase().includes(propertySearchTerm.toLowerCase())
                     ).length === 0 && 
                     !searchingProperties && (
                      <div className="p-4 text-center">
                        <p className="text-gray-500">No properties found</p>
                      </div>
                    )}
                    
                    {/* Loading indicator */}
                    {searchingProperties && (
                      <div className="p-4 text-center">
                        <LoadingSpinner size="sm" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Deal Type - Auto-calculated but shown for reference */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Deal Type</label>
              <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center">
                  {formData.dealType === 'Collaboration' || formData.dealType === 'Marketplace Property' ? (
                    <Users className="h-5 w-5 text-purple-600 mr-2" />
                  ) : formData.dealType === 'Off-plan Project' ? (
                    <Home className="h-5 w-5 text-green-600 mr-2" />
                  ) : (
                    <Home className="h-5 w-5 text-blue-600 mr-2" />
                  )}
                  <span className="font-medium">
                    {formData.dealType === 'Marketplace Property' ? 'Collaboration' : formData.dealType}
                  </span>
                </div>
                <div className="ml-3 text-sm text-gray-500">
                  {formData.dealType === 'Collaboration' || formData.dealType === 'Marketplace Property' 
                    ? 'Working with another agent' 
                    : formData.dealType === 'Off-plan Project'
                    ? 'Developer project deal'
                    : 'Your own property'}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="Draft">Draft</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Docs Sent">Docs Sent</option>
                  <option value="Signed">Signed</option>
                  <option value="Closed">Closed</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
              
              {/* Deal Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deal Value (Optional)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    placeholder="Enter deal value"
                    value={formData.dealValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, dealValue: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            {/* Commission Split */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Commission Split (Optional)</label>
              <textarea
                placeholder="Enter commission split details"
                value={formData.commissionSplit}
                onChange={(e) => setFormData(prev => ({ ...prev, commissionSplit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                rows={2}
              />
            </div>
            
            {/* Commission Document Upload */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Commission Document (Optional)</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center justify-center w-full border-2 border-gray-300 border-dashed rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-6 w-6 text-gray-400" />
                    <div className="text-sm text-gray-500">
                      <span className="font-medium text-black">Click to upload</span> or drag and drop
                    </div>
                    <p className="text-xs text-gray-500">PDF, Word, Excel, or Image (max 10MB)</p>
                  </div>
                </label>
                
                {fileToUpload && (
                  <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-sm truncate max-w-[200px]">{fileToUpload.name}</span>
                    <button
                      type="button"
                      onClick={() => setFileToUpload(null)}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Notes */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                placeholder="Any additional notes about the deal"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                rows={3}
              />
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="p-5 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Create Deal
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDealModal;