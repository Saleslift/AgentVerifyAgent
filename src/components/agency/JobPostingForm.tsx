import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useUserDataContext } from '../../contexts/UserDataContext';



export default function JobPostingForm() {
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
