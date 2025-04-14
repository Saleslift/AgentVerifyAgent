import React, { useState, useEffect, useRef } from 'react';
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  Star, 
  X, 
  AlertCircle,
  Globe2,
  Phone,
  Mail,
  Building2,
  Loader2,
  Filter,
  Trash2
} from 'lucide-react';
import { supabase } from '../../utils/supabase';

interface JobsTabProps {
  agentId: string;
}

type FilterType = 'all' | 'new' | 'shortlisted' | 'pending' | 'rejected';

export default function JobsTab({ agentId }: JobsTabProps) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedAgency, setSelectedAgency] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [applications, setApplications] = useState<{ [key: string]: string }>({});
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchJobs();

    // Set up real-time subscription for application status changes
    const subscription = supabase
      .channel('job_application_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_applications',
          filter: `agent_id=eq.${agentId}`
        },
        (payload) => {
          // Handle real-time updates
          if (payload.eventType === 'UPDATE') {
            const { job_id, status } = payload.new;
            if (status === 'rejected') {
              // Remove job from list if rejected
              setJobs(prev => prev.filter(job => job.id !== job_id));
            } else {
              // Update application status
              setApplications(prev => ({
                ...prev,
                [job_id]: status
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [agentId]);

  const fetchJobs = async () => {
    try {
      // Fetch all active job postings from all agencies
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_postings')
        .select(`
          *,
          agency:profiles!job_postings_agency_id_fkey(
            id,
            full_name,
            avatar_url,
            agency_name,
            agency_logo,
            introduction,
            whatsapp,
            email,
            verified
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Get application statuses
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('job_applications')
        .select('job_id, status, updated_at')
        .eq('agent_id', agentId)
        .order('updated_at', { ascending: false });

      if (applicationsError) throw applicationsError;

      // Create applications status map
      const applicationStatuses = (applicationsData || []).reduce((acc, app) => ({
        ...acc,
        [app.job_id]: app.status
      }), {});

      setJobs(jobsData || []);
      setApplications(applicationStatuses);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load job postings');
    } finally {
      setLoading(false);
    }
  };

  const validateApplication = (coverLetter: string) => {
    if (!coverLetter.trim()) {
      throw new Error('Please provide a cover letter');
    }

    if (coverLetter.length < 50) {
      throw new Error('Cover letter must be at least 50 characters');
    }

    if (coverLetter.length > 1000) {
      throw new Error('Cover letter cannot exceed 1000 characters');
    }
  };

  const handleApply = async (jobId: string) => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      // Validate cover letter
      validateApplication(coverLetter);

      // Check if already applied
      if (applications[jobId]) {
        throw new Error('You have already applied for this position');
      }

      const { error } = await supabase
        .from('job_applications')
        .insert([{
          job_id: jobId,
          agent_id: agentId,
          status: 'pending',
          cover_letter: coverLetter.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Update local state
      setApplications(prev => ({
        ...prev,
        [jobId]: 'pending'
      }));
      setShowApplyModal(false);
      setSelectedJob(null);
      setCoverLetter('');

      // Refresh jobs to ensure UI is up to date
      fetchJobs();
    } catch (err) {
      console.error('Error applying for job:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAgencyClick = (agency: any) => {
    setSelectedAgency(agency);
    setShowAgencyModal(true);
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      setDeletingJobId(jobId);
      
      // If there's no application, just remove from UI
      if (!applications[jobId]) {
        // Just remove from local state
        setJobs(prev => prev.filter(job => job.id !== jobId));
        return;
      }
      
      // If there is an application, delete it from the database
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('job_id', jobId)
        .eq('agent_id', agentId);
        
      if (error) throw error;
      
      // Remove from local state
      setJobs(prev => prev.filter(job => job.id !== jobId));
      
      // Remove from applications state
      const newApplications = { ...applications };
      delete newApplications[jobId];
      setApplications(newApplications);
    } catch (err) {
      console.error('Error handling job:', err);
      setError('Failed to process request');
    } finally {
      setDeletingJobId(null);
    }
  };

  const toggleDescription = (jobId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const filteredJobs = jobs.filter(job => {
    const applicationStatus = applications[job.id];
    
    switch (filterType) {
      case 'new':
        return !applicationStatus;
      case 'shortlisted':
        return applicationStatus === 'accepted';
      case 'pending':
        return applicationStatus === 'pending' || applicationStatus === 'reviewing';
      case 'rejected':
        return applicationStatus === 'rejected';
      default:
        return true;
    }
  }).sort((a, b) => {
    // Sort by application status (applied jobs first)
    const aHasApplication = !!applications[a.id];
    const bHasApplication = !!applications[b.id];
    
    if (aHasApplication && !bHasApplication) return -1;
    if (!aHasApplication && bHasApplication) return 1;
    
    // Then sort by updated_at date (most recent first)
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-300"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Job Opportunities</h2>
        <div className="relative" ref={filterRef}>
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 shadow-sm">
            <Filter className="h-5 w-5 text-gray-500 mr-2" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="bg-white text-gray-800 font-medium px-4 py-2 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-primary-300 focus:border-transparent appearance-none"
              style={{ minWidth: '180px' }}
            >
              <option value="all">All Opportunities</option>
              <option value="new">New Offers</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredJobs.length > 0 ? (
          filteredJobs.map(job => {
            const applicationStatus = applications[job.id];
            
            return (
              <div
                key={job.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        {job.title}
                        {applicationStatus === 'accepted' && (
                          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                            Shortlisted
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-3">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span>{job.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleAgencyClick(job.agency)}
                        className="flex items-center space-x-2"
                      >
                        {job.agency?.agency_logo ? (
                          <img
                            src={job.agency.agency_logo}
                            alt={job.agency.agency_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        {job.agency?.verified && (
                          <Star className="h-5 w-5 text-primary-300" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        disabled={deletingJobId === job.id}
                        className="p-2 text-red-600 hover:text-red-700 disabled:opacity-50"
                        title={applicationStatus ? "Withdraw Application" : "Remove Job"}
                      >
                        {deletingJobId === job.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-sm text-gray-500">Experience Required</label>
                      <p>{job.experience_required}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Languages</label>
                      <div className="flex flex-wrap gap-2">
                        {job.languages.map((lang: string) => (
                          <span
                            key={lang}
                            className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Job Description */}
                  <div className="mb-4">
                    <label className="text-sm text-gray-500">Description</label>
                    <div className={`mt-1 text-gray-700 ${expandedDescriptions.has(job.id) ? '' : 'line-clamp-3'}`}>
                      {job.description}
                    </div>
                    {job.description.length > 150 && (
                      <button 
                        onClick={() => toggleDescription(job.id)}
                        className="mt-1 text-sm text-primary-300 hover:underline"
                      >
                        {expandedDescriptions.has(job.id) ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t pt-4 gap-4">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>
                        Deadline: {new Date(job.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      {applicationStatus && (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          applicationStatus === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : applicationStatus === 'reviewing'
                            ? 'bg-blue-100 text-blue-800'
                            : applicationStatus === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {applicationStatus === 'accepted' ? 'Shortlisted' : 
                           applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1)}
                        </span>
                      )}
                      <button
                        onClick={() => {
                          if (!applicationStatus) {
                            setSelectedJob(job);
                            setShowApplyModal(true);
                          }
                        }}
                        disabled={!!applicationStatus}
                        className={`flex items-center px-4 py-2 rounded-lg ${
                          applicationStatus
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-gray-900'
                        }`}
                      >
                        {applicationStatus ? 'Applied' : 'Quick Apply'}
                        {!applicationStatus && <ChevronRight className="h-4 w-4 ml-1" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No job postings available at the moment.</p>
          </div>
        )}
      </div>

      {/* Quick Apply Modal */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Apply to {selectedJob.title}</h3>
              <button
                onClick={() => {
                  setShowApplyModal(false);
                  setSelectedJob(null);
                  setCoverLetter('');
                  setSubmitError(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submitError && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{submitError}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why should the agency hire you? *
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                  placeholder="Describe your relevant experience and why you'd be a great fit..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  {coverLetter.length}/1000 characters (minimum 50)
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowApplyModal(false);
                    setSelectedJob(null);
                    setCoverLetter('');
                    setSubmitError(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApply(selectedJob.id)}
                  disabled={submitting || coverLetter.length < 50}
                  className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agency Details Modal */}
      {showAgencyModal && selectedAgency && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Agency Details</h3>
              <button
                onClick={() => {
                  setShowAgencyModal(false);
                  setSelectedAgency(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                {selectedAgency.agency_logo ? (
                  <img
                    src={selectedAgency.agency_logo}
                    alt={selectedAgency.agency_name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-gray-400" />
                  </div>
                )}
                <div>
                  <h4 className="text-lg font-semibold">{selectedAgency.agency_name}</h4>
                  {selectedAgency.verified && (
                    <div className="flex items-center text-primary-300">
                      <Star className="h-4 w-4 mr-1" />
                      <span className="text-sm">Verified Agency</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">About</label>
                  <p className="mt-1">{selectedAgency.introduction || 'No description available'}</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <a
                    href={`mailto:${selectedAgency.email}`}
                    className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <Mail className="h-5 w-5 mr-3" />
                    {selectedAgency.email}
                  </a>
                  <a
                    href={`tel:${selectedAgency.whatsapp}`}
                    className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <Phone className="h-5 w-5 mr-3" />
                    {selectedAgency.whatsapp}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}