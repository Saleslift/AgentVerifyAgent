import React, { useState, useEffect } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { 
  Briefcase, Plus, Search, Edit, Trash2, Eye, Clock, Calendar, MapPin, 
  DollarSign, Languages, LayoutGrid, List, Users, CheckCircle, XCircle, 
  Clock4, Mail, MessageSquare, ExternalLink, User, Filter, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useUserDataContext } from '../../contexts/UserDataContext';

interface JobPosting {
  id: string;
  title: string;
  experience_required: string;
  languages: string[];
  location: string;
  salary_min?: number;
  salary_max?: number;
  deadline: string;
  status: string;
  created_at: string;
  applications_count?: number;
  contract_type?: string;
}

interface JobApplication {
  id: string;
  job_id: string;
  agent_id: string;
  status: string;
  cover_letter?: string;
  created_at: string;
  agent?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    whatsapp?: string;
    slug?: string;
  };
}

export default function AgencyJobs() {
  const { profile } = useUserDataContext();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contractFilter, setContractFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  
  const fetchJobs = async () => {
    if (!profile?.id) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('job_postings')
        .select(`
          *,
          applications:job_applications(count)
        `)
        .eq('agency_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to include application count
      const transformedData = data.map(job => ({
        ...job,
        applications_count: job.applications?.length || 0,
        contract_type: job.contract_type || 'Full-Time' // Default to Full-Time if not specified
      }));
      
      setJobs(transformedData);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchJobs();
    
    // Set up real-time subscription for job updates
    const jobsChannel = supabase
      .channel('job_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_postings',
          filter: `agency_id=eq.${profile?.id}`
        },
        () => {
          fetchJobs();
        }
      )
      .subscribe();
      
    // Set up real-time subscription for application updates
    const applicationsChannel = supabase
      .channel('application_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_applications'
        },
        () => {
          fetchJobs();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(jobsChannel);
      supabase.removeChannel(applicationsChannel);
    };
  }, [profile?.id]);
  
  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    
    try {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', jobId);
      
      if (error) throw error;
      
      // Update local state
      setJobs(prev => prev.filter(job => job.id !== jobId));
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };
  
  const toggleJobStatus = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('job_postings')
        .update({ status: newStatus })
        .eq('id', jobId);
      
      if (error) throw error;
      
      // Update local state
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: newStatus } : job
      ));
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };
  
  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesContract = contractFilter === 'all' || job.contract_type === contractFilter;
    
    return matchesSearch && matchesStatus && matchesContract;
  });
  
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-300"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={
        <div>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold">Job Postings</h1>
              <p className="text-gray-500">Manage your job listings and applications</p>
            </div>
            
            <Link
              to="/agency-dashboard/jobs/create"
              className="flex items-center justify-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Post New Job</span>
            </Link>
          </div>
          
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="w-full md:w-auto flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search job postings"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                
                <select
                  value={contractFilter}
                  onChange={(e) => setContractFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white"
                >
                  <option value="all">All Contract Types</option>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Freelance">Freelance</option>
                </select>
                
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 ${viewMode === 'list' ? 'bg-black text-white' : 'bg-white text-gray-700'}`}
                    aria-label="List view"
                  >
                    <List className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('card')}
                    className={`px-3 py-2 ${viewMode === 'card' ? 'bg-black text-white' : 'bg-white text-gray-700'}`}
                    aria-label="Card view"
                  >
                    <LayoutGrid className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Job List */}
          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No job postings found</h3>
              <p className="text-gray-500 mb-6">
                {jobs.length === 0
                  ? "You haven't created any job postings yet."
                  : "No job postings match your current filters."}
              </p>
              {jobs.length === 0 && (
                <Link
                  to="/agency-dashboard/jobs/create"
                  className="inline-flex items-center justify-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create Your First Job Posting</span>
                </Link>
              )}
            </div>
          ) : viewMode === 'list' ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Location
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Contract
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Applications
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredJobs.map(job => (
                      <tr key={job.id} className="group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Briefcase className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-gray-900 group-hover:text-black transition-colors">{job.title}</div>
                              <div className="text-sm text-gray-500 md:hidden">
                                {job.location} • {job.applications_count} applications
                              </div>
                              <div className="text-xs text-gray-400 md:hidden">
                                Created: {new Date(job.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="text-sm text-gray-900 flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" />
                            {job.location}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {job.contract_type || 'Full-Time'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <Link
                            to={`/agency-dashboard/jobs/${job.id}/applications`}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {job.applications_count} {job.applications_count === 1 ? 'application' : 'applications'}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleJobStatus(job.id, job.status)}
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              job.status === 'active'
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            } transition-colors`}
                          >
                            {job.status === 'active' ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link
                              to={`/agency-dashboard/jobs/${job.id}/applications`}
                              className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="View applications"
                            >
                              <Users className="h-5 w-5" />
                            </Link>
                            <Link
                              to={`/agency-dashboard/jobs/${job.id}`}
                              className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-50 transition-colors"
                              title="View job details"
                            >
                              <Eye className="h-5 w-5" />
                            </Link>
                            <Link
                              to={`/agency-dashboard/jobs/edit/${job.id}`}
                              className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-50 transition-colors"
                              title="Edit job"
                            >
                              <Edit className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Delete job"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map(job => (
                <div key={job.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 pr-4">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{job.title}</h3>
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" />
                          <span>{job.contract_type || 'Full-Time'}</span>
                        </div>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          job.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">Experience:</div>
                        <div className="text-sm font-medium">{job.experience_required}</div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">Applications:</div>
                        <div className="text-sm font-medium">{job.applications_count}</div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">Deadline:</div>
                        <div className="text-sm font-medium">{new Date(job.deadline).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      {job.languages.slice(0, 3).map(language => (
                        <span key={language} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          {language}
                        </span>
                      ))}
                      {job.languages.length > 3 && (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          +{job.languages.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-auto border-t border-gray-100 p-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <Link
                      to={`/agency-dashboard/jobs/${job.id}/applications`}
                      className="col-span-2 lg:col-span-2 inline-flex justify-center items-center space-x-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors"
                    >
                      <Users className="h-4 w-4" />
                      <span>{job.applications_count} Applications</span>
                    </Link>
                    
                    <Link
                      to={`/agency-dashboard/jobs/${job.id}`}
                      className="inline-flex justify-center items-center py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    
                    <Link
                      to={`/agency-dashboard/jobs/edit/${job.id}`}
                      className="inline-flex justify-center items-center py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    
                    <button
                      onClick={() => toggleJobStatus(job.id, job.status)}
                      className={`col-span-1 inline-flex justify-center items-center py-2 rounded transition-colors ${
                        job.status === 'active'
                          ? 'bg-green-50 hover:bg-green-100 text-green-700'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {job.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="col-span-1 inline-flex justify-center items-center py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      } />
      
      {/* Create/Edit Job Form */}
      <Route path="/create" element={<JobPostingForm />} />
      <Route path="/edit/:id" element={<JobPostingForm />} />
      <Route path="/:id" element={<JobDetails />} />
      <Route path="/:id/applications" element={<JobApplications />} />
    </Routes>
  );
}

function JobPostingForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useUserDataContext();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    contract_type: 'Full-Time',
    experience_required: '',
    languages: [] as string[],
    location: '',
    salary_min: '',
    salary_max: '',
    description: '',
    qualifications: [] as string[],
    deadline: ''
  });
  
  useEffect(() => {
    if (id) {
      setIsEditing(true);
      fetchJobDetails();
    }
  }, [id]);
  
  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Format the deadline date for input type="date"
      const deadlineDate = new Date(data.deadline);
      const formattedDeadline = deadlineDate.toISOString().split('T')[0];
      
      setFormData({
        ...data,
        deadline: formattedDeadline,
        qualifications: Array.isArray(data.qualifications) ? data.qualifications : data.qualifications?.split('\n') || [],
        languages: Array.isArray(data.languages) ? data.languages : [],
        salary_min: data.salary_min?.toString() || '',
        salary_max: data.salary_max?.toString() || '',
        contract_type: data.contract_type || 'Full-Time'
      });
      
    } catch (error) {
      console.error('Error fetching job details:', error);
      navigate('/agency-dashboard/jobs');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.id) return;
    
    try {
      setLoading(true);
      
      // Prepare data
      const jobData = {
        ...formData,
        agency_id: profile.id,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        status: 'active'
      };
      
      if (isEditing) {
        // Update existing job posting
        const { error } = await supabase
          .from('job_postings')
          .update(jobData)
          .eq('id', id);
        
        if (error) throw error;
      } else {
        // Create new job posting
        const { error } = await supabase
          .from('job_postings')
          .insert([jobData]);
        
        if (error) throw error;
      }
      
      // Redirect back to jobs list
      navigate('/agency-dashboard/jobs');
    } catch (error) {
      console.error('Error saving job posting:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && isEditing) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-300"></div>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">{isEditing ? 'Edit Job Posting' : 'Create Job Posting'}</h1>
      
      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-full">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="contract_type" className="block text-sm font-medium text-gray-700 mb-1">
                Contract Type *
              </label>
              <select
                id="contract_type"
                required
                value={formData.contract_type}
                onChange={(e) => setFormData(prev => ({ ...prev, contract_type: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                Experience Required *
              </label>
              <input
                type="text"
                id="experience"
                required
                value={formData.experience_required}
                onChange={(e) => setFormData(prev => ({ ...prev, experience_required: e.target.value }))}
                placeholder="e.g. 2+ years"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                id="location"
                required
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Languages *
              </label>
              <div className="flex flex-wrap gap-2">
                {['English', 'Arabic', 'Hindi', 'Urdu', 'Russian', 'Chinese', 'French'].map(language => (
                  <label key={language} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.languages.includes(language)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            languages: [...prev.languages, language]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            languages: prev.languages.filter(lang => lang !== language)
                          }));
                        }
                      }}
                      className="rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span className="ml-2 mr-4 text-sm">{language}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label htmlFor="salary_min" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Salary
              </label>
              <input
                type="number"
                id="salary_min"
                value={formData.salary_min}
                onChange={(e) => setFormData(prev => ({ ...prev, salary_min: e.target.value }))}
                placeholder="AED per month"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="salary_max" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Salary
              </label>
              <input
                type="number"
                id="salary_max"
                value={formData.salary_max}
                onChange={(e) => setFormData(prev => ({ ...prev, salary_max: e.target.value }))}
                placeholder="AED per month"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            
            <div className="col-span-full">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Job Description *
              </label>
              <textarea
                id="description"
                required
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            
            <div className="col-span-full">
              <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700 mb-1">
                Qualifications *
              </label>
              <textarea
                id="qualifications"
                required
                value={formData.qualifications.join('\n')}
                onChange={(e) => setFormData(prev => ({ ...prev, qualifications: e.target.value.split('\n').filter(q => q.trim() !== '') }))}
                placeholder="Enter one qualification per line"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                Application Deadline *
              </label>
              <input
                type="date"
                id="deadline"
                required
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/agency-dashboard/jobs')}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-white bg-black hover:bg-gray-900 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Job Posting' : 'Create Job Posting')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
  }, [id]);
  
  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('job_postings')
        .select(`
          *,
          applications:job_applications(count)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      setJob({
        ...data,
        applications_count: data.applications?.length || 0,
        contract_type: data.contract_type || 'Full-Time'
      });
      
    } catch (error) {
      console.error('Error fetching job details:', error);
      navigate('/agency-dashboard/jobs');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading || !job) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-300"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">{job.title}</h1>
        <div className="flex space-x-3">
          <Link
            to={`/agency-dashboard/jobs/${job.id}/applications`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Users className="h-5 w-5 mr-2" />
            View Applications
          </Link>
          <Link
            to={`/agency-dashboard/jobs/edit/${job.id}`}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            <Edit className="h-5 w-5 mr-2 inline-block" />
            Edit Job
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Job Description</h2>
            <div className="prose max-w-none">
              {job.description.split('\n').map((paragraph, index) => (
                paragraph ? <p key={index} className="mb-4">{paragraph}</p> : <br key={index} />
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Qualifications</h2>
            <ul className="list-disc pl-5 space-y-2">
              {job.qualifications.map((qualification, index) => (
                <li key={index} className="text-gray-700">{qualification}</li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Job Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Location</div>
                  <div className="font-medium">{job.location}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Briefcase className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Contract Type</div>
                  <div className="font-medium">{job.contract_type || 'Full-Time'}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Experience Required</div>
                  <div className="font-medium">{job.experience_required}</div>
                </div>
              </div>
              
              {(job.salary_min || job.salary_max) && (
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Salary Range</div>
                    <div className="font-medium">
                      {job.salary_min && job.salary_max 
                        ? `AED ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                        : job.salary_min 
                          ? `From AED ${job.salary_min.toLocaleString()}`
                          : `Up to AED ${job.salary_max.toLocaleString()}`
                      }
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Application Deadline</div>
                  <div className="font-medium">{new Date(job.deadline).toLocaleDateString()}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Languages className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Languages</div>
                  <div className="font-medium">{job.languages.join(', ')}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Job Status</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Current Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  job.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {job.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Total Applications:</span>
                <span className="font-medium">{job.applications_count}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Posted On:</span>
                <span className="font-medium">{new Date(job.created_at).toLocaleDateString()}</span>
              </div>
              
              <button
                onClick={() => navigate(`/agency-dashboard/jobs/${job.id}/applications`)}
                className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Users className="h-5 w-5 mr-2" />
                View Applications
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JobApplications() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedApplication, setExpandedApplication] = useState<string | null>(null);
  
  useEffect(() => {
    if (id) {
      fetchJobDetails();
      fetchApplications();
      
      // Set up real-time subscription for application updates
      const applicationsChannel = supabase
        .channel('job_applications_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'job_applications',
            filter: `job_id=eq.${id}`
          },
          () => {
            fetchApplications();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(applicationsChannel);
      };
    }
  }, [id]);
  
  const fetchJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      setJob(data);
      
    } catch (error) {
      console.error('Error fetching job details:', error);
      navigate('/agency-dashboard/jobs');
    }
  };
  
  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          agent:agent_id(id, full_name, email, avatar_url, whatsapp, slug)
        `)
        .eq('job_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setApplications(data || []);
      
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);
      
      if (error) throw error;
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };
  
  const toggleExpandApplication = (applicationId: string) => {
    if (expandedApplication === applicationId) {
      setExpandedApplication(null);
    } else {
      setExpandedApplication(applicationId);
    }
  };
  
  if (loading && !job) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-300"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{job?.title || 'Job'} Applications</h1>
          <p className="text-gray-500">{applications.length} applications received</p>
        </div>
        
        <Link
          to="/agency-dashboard/jobs"
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
        >
          Back to Jobs
        </Link>
      </div>
      
      {loading ? (
        <div className="min-h-[20vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-300"></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-500">
            There are currently no applications for this job posting.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(application => (
            <div 
              key={application.id} 
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 flex-shrink-0">
                      {application.agent?.avatar_url ? (
                        <img 
                          src={application.agent.avatar_url} 
                          alt={application.agent.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold">{application.agent?.full_name}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {application.status === 'accepted' ? 'Accepted' :
                           application.status === 'rejected' ? 'Rejected' :
                           'Pending'}
                        </span>
                      </div>
                      
                      <div className="mt-1 text-sm text-gray-500 flex items-center space-x-3">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          <span>{application.agent?.email}</span>
                        </div>
                        
                        {application.agent?.whatsapp && (
                          <a 
                            href={`https://wa.me/${application.agent.whatsapp.replace(/\+/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 flex items-center"
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                      
                      <div className="mt-1 text-sm text-gray-500">
                        <Clock4 className="h-4 w-4 mr-1 inline-block" />
                        <span>Applied {new Date(application.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {application.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => updateApplicationStatus(application.id, 'accepted')}
                          className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                          title="Accept application"
                        >
                          <CheckCircle className="h-6 w-6" />
                        </button>
                        
                        <button
                          onClick={() => updateApplicationStatus(application.id, 'rejected')}
                          className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          title="Reject application"
                        >
                          <XCircle className="h-6 w-6" />
                        </button>
                      </>
                    )}
                    
                    {application.agent?.slug && (
                      <a
                        href={`/agent/${application.agent.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        title="View agent profile"
                      >
                        <ExternalLink className="h-6 w-6" />
                      </a>
                    )}
                    
                    <button
                      onClick={() => toggleExpandApplication(application.id)}
                      className="p-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      title={expandedApplication === application.id ? "Hide details" : "View details"}
                    >
                      {expandedApplication === application.id ? (
                        <ChevronUp className="h-6 w-6" />
                      ) : (
                        <ChevronDown className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Expanded details */}
                {expandedApplication === application.id && application.cover_letter && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Cover Letter</h4>
                    <div className="text-sm text-gray-600 whitespace-pre-line">
                      {application.cover_letter}
                    </div>
                    
                    <div className="mt-4 flex justify-end space-x-3">
                      {application.agent?.whatsapp && (
                        <a 
                          href={`https://wa.me/${application.agent.whatsapp.replace(/\+/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          <span>Contact via WhatsApp</span>
                        </a>
                      )}
                      
                      {application.agent?.slug && (
                        <a
                          href={`/agent/${application.agent.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          <span>View Full Profile</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Application actions */}
              {application.status === 'pending' && (
                <div className="bg-gray-50 p-4 flex space-x-4">
                  <button 
                    onClick={() => updateApplicationStatus(application.id, 'accepted')}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>Accept Application</span>
                  </button>
                  
                  <button
                    onClick={() => updateApplicationStatus(application.id, 'rejected')}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    <span>Reject Application</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}