import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import {Users, Edit, MapPin, Briefcase, Clock, DollarSign, Calendar, Languages} from 'lucide-react';

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


export default function JobDetails() {
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
