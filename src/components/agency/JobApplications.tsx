import React, { useState, useEffect } from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock4,
  ExternalLink,
  Mail,
  MessageSquare,
  User,
  Users,
  XCircle
} from 'lucide-react';


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

export default function JobApplications() {
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
