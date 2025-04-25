import React, { useState, useEffect } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import {
  Briefcase, Plus, Search, Edit, Trash2, Eye, Clock, Calendar, MapPin,
  DollarSign, Languages, LayoutGrid, List, Users, CheckCircle, XCircle,
  Clock4, Mail, MessageSquare, ExternalLink, User, Filter, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useUserDataContext } from '../../contexts/UserDataContext';
import JobPostingForm from "./JobPostingForm.tsx";
import JobDetails from "./JobDetails.tsx";
import JobApplications from "./JobApplications.tsx";

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







