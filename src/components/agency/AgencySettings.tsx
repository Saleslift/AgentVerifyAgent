import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Upload, AlertCircle, Mail, Phone, Globe2, MapPin, Building, Calendar, Users } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useUserDataContext } from '../../contexts/UserDataContext';
import { useAuth } from '../../contexts/AuthContext';

export default function AgencySettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, refresh } = useUserDataContext();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    agencyName: '',
    agencyEmail: '',
    agencyWebsite: '',
    agencyPhone: '',
    location: '',
    agencyFormationDate: '',
    agencyTeamSize: ''
  });
  
  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        agencyName: profile.full_name || '',
        agencyEmail: profile.agency_email || '',
        agencyWebsite: profile.agency_website || '',
        agencyPhone: profile.whatsapp || '',
        location: profile.location || '',
        agencyFormationDate: profile.agency_formation_date || '',
        agencyTeamSize: profile.agency_team_size ? String(profile.agency_team_size) : ''
      });
      
      setLogoPreview(profile.agency_logo || null);
    }
  }, [profile]);
  
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      reader.onload = (e) => setLogoPreview(e.target?.result as string);
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
      
      // No need to update form data, we'll use this URL when saving
      setLogoPreview(publicUrl);
    } catch (err) {
      console.error('Error uploading logo:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.agencyName,
          agency_email: formData.agencyEmail,
          agency_website: formData.agencyWebsite,
          whatsapp: formData.agencyPhone,
          location: formData.location,
          agency_formation_date: formData.agencyFormationDate,
          agency_team_size: formData.agencyTeamSize ? parseInt(formData.agencyTeamSize) : null,
          agency_logo: logoPreview,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccess(true);
      
      // Refresh profile data
      await refresh();
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Agency Settings</h1>
      
      <div className="bg-white rounded-xl shadow-sm p-6">
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
                <p className="text-sm text-green-700">Agency profile updated successfully!</p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Agency Logo */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Agency Logo</h2>
            <div className="flex items-center space-x-6">
              <div className="relative">
                {logoPreview ? (
                  <img
                    src={logoPreview}
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
                    onChange={handleLogoUpload}
                    className="hidden"
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
          </div>
          
          {/* Agency Information */}
          <div>
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agency Email
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
                  Agency Website
                </label>
                <div className="relative">
                  <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    value={formData.agencyWebsite}
                    onChange={(e) => setFormData(prev => ({ ...prev, agencyWebsite: e.target.value }))}
                    placeholder="https://"
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
                  Agency Formation Date
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
                    value={formData.agencyTeamSize}
                    onChange={(e) => setFormData(prev => ({ ...prev, agencyTeamSize: e.target.value }))}
                    className="pl-10 pr-4 py-2.5 w-full rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/agency-dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <X className="h-5 w-5 mr-2 inline-block" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 disabled:opacity-50 flex items-center"
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
        </form>
      </div>
    </div>
  );
}