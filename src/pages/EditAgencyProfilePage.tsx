import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Upload, AlertCircle, Mail, Phone, Globe2, MapPin, Building, Calendar, Users } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { useRoleAuth } from '../hooks/useRoleAuth';
import { supabase } from '../utils/supabase';

interface AgencyProfileData {
  agencyName: string;
  introduction: string;
  agencyWebsite: string;
  agencyEmail: string;
  agencyFormationDate: string;
  agencyTeamSize: number;
  agencyPhone: string;
  location: string;
  agencyLogo: string;
}

export default function EditAgencyProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useRoleAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [agencyLogoPreview, setAgencyLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<AgencyProfileData>({
    agencyName: '',
    introduction: '',
    agencyWebsite: '',
    agencyEmail: '',
    agencyFormationDate: '',
    agencyTeamSize: 0,
    agencyPhone: '',
    location: '',
    agencyLogo: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          agencyName: data.full_name || '',
          introduction: data.introduction || '',
          agencyWebsite: data.agency_website || '',
          agencyEmail: data.agency_email || '',
          agencyFormationDate: data.agency_formation_date || '',
          agencyTeamSize: data.agency_team_size || 0,
          agencyPhone: data.whatsapp || '',
          location: data.location || '',
          agencyLogo: data.agency_logo || ''
        });
        setAgencyLogoPreview(data.agency_logo || null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data');
    }
  };

  const handleAgencyLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('Please upload a JPG, PNG, or WebP image');
      }

      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Image size must be less than 2MB');
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setAgencyLogoPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${user.id}-agency-logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      setFormData(prev => ({
        ...prev,
        agencyLogo: publicUrl
      }));
    } catch (err) {
      console.error('Error uploading agency logo:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload agency logo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Validate required fields
      if (!formData.agencyName.trim()) throw new Error('Agency name is required');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.agencyName,
          introduction: formData.introduction,
          agency_website: formData.agencyWebsite,
          agency_email: formData.agencyEmail,
          agency_formation_date: formData.agencyFormationDate,
          agency_team_size: formData.agencyTeamSize,
          whatsapp: formData.agencyPhone,
          location: formData.location,
          agency_logo: formData.agencyLogo,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        navigate('/agency-dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not an agency
  if (role && role !== 'agency') {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-20">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Edit Agency Profile</h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => navigate('/agency-dashboard')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <X className="h-5 w-5 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-primary-300 text-on-primary rounded-md hover:bg-primary-400 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⌛</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      Profile updated successfully! Redirecting to dashboard...
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Agency Logo */}
              <section>
                <h2 className="text-lg font-semibold mb-4">Agency Logo</h2>
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    {agencyLogoPreview ? (
                      <img
                        src={agencyLogoPreview}
                        alt="Agency Logo"
                        className="w-32 h-32 rounded-lg object-contain bg-gray-100"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Building className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handleAgencyLogoUpload}
                        className="hidden"
                        ref={logoInputRef}
                      />
                      <Upload className="h-5 w-5 text-gray-600" />
                    </label>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">
                      Upload your agency logo.
                    </p>
                    <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
                      <li>Maximum file size: 2MB</li>
                      <li>Recommended dimensions: 400x400 pixels</li>
                      <li>Accepted formats: JPG, PNG, WebP</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Basic Information */}
              <section>
                <h2 className="text-lg font-semibold mb-4">Agency Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Agency Name *
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={formData.agencyName}
                        onChange={(e) => setFormData(prev => ({ ...prev, agencyName: e.target.value }))}
                        className="pl-10 pr-4 py-2.5 w-full rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Introduction / About
                    </label>
                    <textarea
                      value={formData.introduction}
                      onChange={(e) => setFormData(prev => ({ ...prev, introduction: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                      placeholder="Tell clients about your agency..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.agencyEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, agencyEmail: e.target.value }))}
                        className="pl-10 pr-4 py-2.5 w-full rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <div className="relative">
                      <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="url"
                        value={formData.agencyWebsite}
                        onChange={(e) => setFormData(prev => ({ ...prev, agencyWebsite: e.target.value }))}
                        className="pl-10 pr-4 py-2.5 w-full rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        required
                        value={formData.agencyPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, agencyPhone: e.target.value }))}
                        placeholder="+971"
                        className="pl-10 pr-4 py-2.5 w-full rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        className="pl-10 pr-4 py-2.5 w-full rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Formation Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.agencyFormationDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, agencyFormationDate: e.target.value }))}
                        className="pl-10 pr-4 py-2.5 w-full rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team Size
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        min="1"
                        value={formData.agencyTeamSize || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, agencyTeamSize: parseInt(e.target.value) || 0 }))}
                        className="pl-10 pr-4 py-2.5 w-full rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
