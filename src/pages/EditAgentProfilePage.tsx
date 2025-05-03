import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Upload, AlertCircle, Languages, Award, MapPin, Phone, Mail, Globe2, Youtube, Facebook, Instagram, Linkedin, BookText as TikTok, Twitter, Building2, Shield, LockIcon } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { useRoleAuth } from '../hooks/useRoleAuth';
import { useAgentServiceAreas } from '../hooks/useAgentServiceAreas';
import { useAgentCertifications } from '../hooks/useAgentCertifications';
import ServiceAreasPanel from '../components/ServiceAreasPanel';
import CertificationsPanel from '../components/CertificationsPanel';
import CertificationModal from '../components/CertificationModal';
import { supabase } from '../utils/supabase';
import AgencySection from '../components/agent/AgencySection';
import AgencySearchSection from '../components/agent/AgencySearchSection';
import ProfileImageUpload from '../components/ProfileImageUpload';
import PromotionVideoUpload from '../components/PromotionVideoUpload';

interface AgentProfileData {
  fullName: string;
  introduction: string;
  registrationNumber: string;
  whatsapp: string;
  location: string;
  experience: string;
  languages: string[];
  specialties: string[];
  avatarUrl: string;
  youtube?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  tiktok?: string;
  x?: string;
  agencyName?: string;
  agencyLogo?: string;
  agencyWebsite?: string;
  agencyEmail?: string;
  agencyFormationDate?: string;
  agencyTeamSize?: number;
  agencyId?: string | null; // Add agency_id field to track if linked to an agency
  promotionVideoUrl?: string;
}

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useRoleAuth();
  const { serviceAreas, addServiceArea, removeServiceArea } = useAgentServiceAreas(user?.id);
  const { certifications, uploadCertification, removeCertification } = useAgentCertifications(user?.id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newLanguage, setNewLanguage] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newServiceArea, setNewServiceArea] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [agencyLogoPreview, setAgencyLogoPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [linkedAgency, setLinkedAgency] = useState<{id: string, name: string} | null>(null);
  const [agencyDetails, setAgencyDetails] = useState<any | null>(null);
  const [isShowingAgencySearch, setIsShowingAgencySearch] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<AgentProfileData>({
    fullName: '',
    introduction: '',
    registrationNumber: '',
    whatsapp: '',
    location: '',
    experience: '',
    languages: [],
    specialties: [],
    avatarUrl: '',
    youtube: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    tiktok: '',
    x: '',
    agencyName: '',
    agencyLogo: '',
    agencyWebsite: '',
    agencyEmail: '',
    agencyFormationDate: '',
    agencyTeamSize: 0,
    agencyId: null,
    promotionVideoUrl: ''
  });

  // Check if agent has RERA certificate
  const hasReraCertificate = certifications.some(cert => cert.is_rera);

  // Fetch profile data
  const fetchData = async () => {
    try {
      if (!user) return;

      // Fetch profile with agency data
      const { data, error: profileError } = await supabase
          .from('profiles')
          .select(`
          *,
          agency:agency_id(
            id,
            full_name,
            agency_name,
            agency_logo,
            agency_website,
            agency_email,
            agency_formation_date,
            agency_team_size,
            location,
            whatsapp,
            email
          )
        `)
          .eq('id', user.id)
          .single();

      if (profileError) throw profileError;

      // Set agency details if available
      if (data.agency_id && data.agency) {
        setLinkedAgency({
          id: data.agency.id,
          name: data.agency.agency_name || data.agency.full_name || 'Agency'
        });
        setAgencyDetails(data.agency);
      }

      // Set form data
      setFormData({
        fullName: data.full_name || '',
        introduction: data.introduction || '',
        registrationNumber: data.registration_number || '',
        whatsapp: data.whatsapp || '',
        location: data.location || '',
        experience: data.experience || '',
        languages: data.languages || [],
        specialties: data.specialties || [],
        avatarUrl: data.avatar_url || '',
        youtube: data.youtube || '',
        facebook: data.facebook || '',
        instagram: data.instagram || '',
        linkedin: data.linkedin || '',
        tiktok: data.tiktok || '',
        x: data.x || '',
        agencyName: data.agency_name || '',
        agencyLogo: data.agency_logo || '',
        agencyWebsite: data.agency_website || '',
        agencyEmail: data.agency_email || '',
        agencyFormationDate: data.agency_formation_date || null,
        agencyTeamSize: data.agency_team_size || 0,
        agencyId: data.agency_id,
        promotionVideoUrl: data.promotion_video_url || ''
      });

      // Set previews
      setAvatarPreview(data.avatar_url || null);
      setAgencyLogoPreview(data.agency_logo || null);
      setVideoPreview(data.promotion_video_url || null);

    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Failed to load profile data. Please try again.');
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${user.id}-avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, {
            upsert: true,
            contentType: file.type
          });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

      setFormData(prev => ({
        ...prev,
        avatarUrl: publicUrl
      }));
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
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

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      // Validate file type
      if (!['video/mp4', 'video/webm'].includes(file.type)) {
        throw new Error('Please upload an MP4 or WebM video');
      }

      // Validate file size (50MB)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('Video size must be less than 50MB');
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setVideoPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      // Remove spaces from the file name
      const sanitizedFileName = file.name.replace(/\s+/g, '_');
      const fileName = `${user.id}/${sanitizedFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      setFormData((prev) => ({
        ...prev,
        promotionVideoUrl: publicUrl,
      }));
    } catch (err) {
      console.error('Error uploading video:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload video');
    }
  };

  const handleRemoveVideo = async () => {
    try {
      if (!user || !formData.promotionVideoUrl) return;

      // Extract file name from the URL
      const fileName = formData.promotionVideoUrl.split('/').pop();

      if (!fileName) throw new Error('Invalid video URL');

      // Remove video from Supabase storage
      const { error: deleteError } = await supabase.storage
        .from('videos')
        .remove([fileName]);

      if (deleteError) throw deleteError;

      // Update state
      setFormData((prev) => ({
        ...prev,
        promotionVideoUrl: '',
      }));
      setVideoPreview(null);
    } catch (err) {
      console.error('Error removing video:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove video');
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
      if (!formData.fullName.trim()) throw new Error('Full name is required');
      if (!formData.registrationNumber.trim()) throw new Error('Registration number is required');
      if (!formData.whatsapp.trim()) throw new Error('WhatsApp number is required');

      // Determine what fields to update based on agency status
      const updateFields: any = {
        full_name: formData.fullName,
        introduction: formData.introduction,
        registration_number: formData.registrationNumber,
        whatsapp: formData.whatsapp,
        location: formData.location,
        experience: formData.experience,
        languages: formData.languages,
        specialties: formData.specialties,
        avatar_url: formData.avatarUrl,
        youtube: formData.youtube,
        facebook: formData.facebook,
        instagram: formData.instagram,
        linkedin: formData.linkedin,
        tiktok: formData.tiktok,
        x: formData.x,
        promotion_video_url: formData.promotionVideoUrl,
        updated_at: new Date().toISOString()
      };

      // Only update agency fields if not linked to an agency
      if (!formData.agencyId) {
        updateFields.agency_name = formData.agencyName;
        updateFields.agency_logo = formData.agencyLogo;
        updateFields.agency_website = formData.agencyWebsite;
        updateFields.agency_email = formData.agencyEmail;
        updateFields.agency_formation_date = formData.agencyFormationDate ;
        updateFields.agency_team_size = formData.agencyTeamSize;
      }

      const { error: updateError } = await supabase
          .from('profiles')
          .update(updateFields)
          .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccess(true);
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

  const handleCertificationUpload = async (
      file: File,
      name: string,
      isRera: boolean,
      reraNumber?: string
  ) => {
    try {
      await uploadCertification(file, name, isRera, reraNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload certification');
    }
  };

  const handleShowAgencySearch = () => {
    setIsShowingAgencySearch(true);
  };

  // Redirect if not an agent
  if (role && role !== 'agent') {
    navigate('/dashboard');
    return null;
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-20">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                <h1 className="text-2xl font-bold text-gray-900">Edit Agent Profile</h1>
                <div className="flex space-x-4">
                  <button
                      onClick={() => navigate('/dashboard')}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Cancel
                  </button>
                  <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 disabled:opacity-50"
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
                          Profile updated successfully!
                        </p>
                      </div>
                    </div>
                  </div>
              )}

              {linkedAgency && (
                  <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <LockIcon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700 font-medium">
                          You are connected to {linkedAgency.name}
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                          Your agency information is managed by your agency administrator.
                        </p>
                      </div>
                    </div>
                  </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Profile Photo */}
                <section>
                  <h2 className="text-lg font-semibold mb-4">Profile Photo</h2>
                  <ProfileImageUpload
                    imagePreview={avatarPreview}
                    onUpload={handleAvatarUpload}
                  />
                </section>

                {/* Promotion Video */}
                <section>
                  <h2 className="text-lg font-semibold mb-4">Promotion Video</h2>
                  <PromotionVideoUpload
                    videoPreview={videoPreview}
                    onUpload={handleVideoUpload}
                    onRemove={handleRemoveVideo}
                  />
                </section>

                {/* Basic Information */}
                <section>
                  <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Registration Number *
                      </label>
                      <input
                          type="text"
                          required
                          value={formData.registrationNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Professional Introduction
                      </label>
                      <input
                          type="text"
                          value={formData.introduction}
                          onChange={(e) => setFormData(prev => ({ ...prev, introduction: e.target.value }))}
                          placeholder="e.g., Luxury Real Estate Specialist with 10+ years of experience"
                          className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                    </div>
                  </div>
                </section>

                {/* Contact Information */}
                <section>
                  <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        WhatsApp Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="tel"
                            required
                            value={formData.whatsapp}
                            onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                            placeholder="+971"
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent"
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
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Experience *
                      </label>
                      <div className="relative">
                        <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            required
                            value={formData.experience}
                            onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                            placeholder="e.g., 5+ years"
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Languages */}
                <section>
                  <h2 className="text-lg font-semibold mb-4">Languages</h2>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {formData.languages.map((language, index) => (
                          <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-black/10 text-gray-900"
                          >
                        {language}
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  languages: prev.languages.filter((_, i) => i !== index)
                                }))}
                                className="ml-2 text-gray-900 hover:text-gray-700"
                            >
                          <X className="h-4 w-4" />
                        </button>
                      </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Languages className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={newLanguage}
                            onChange={(e) => setNewLanguage(e.target.value)}
                            placeholder="Add a language"
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                      <button
                          type="button"
                          onClick={() => {
                            if (newLanguage.trim()) {
                              setFormData(prev => ({
                                ...prev,
                                languages: [...prev.languages, newLanguage.trim()]
                              }));
                              setNewLanguage('');
                            }
                          }}
                          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </section>

                {/* Specialties */}
                <section>
                  <h2 className="text-lg font-semibold mb-4">Specialties</h2>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {formData.specialties.map((specialty, index) => (
                          <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-black/10 text-gray-900"
                          >
                        {specialty}
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  specialties: prev.specialties.filter((_, i) => i !== index)
                                }))}
                                className="ml-2 text-gray-900 hover:text-gray-700"
                            >
                          <X className="h-4 w-4" />
                        </button>
                      </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={newSpecialty}
                            onChange={(e) => setNewSpecialty(e.target.value)}
                            placeholder="Add a specialty"
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                      <button
                          type="button"
                          onClick={() => {
                            if (newSpecialty.trim()) {
                              setFormData(prev => ({
                                ...prev,
                                specialties: [...prev.specialties, newSpecialty.trim()]
                              }));
                              setNewSpecialty('');
                            }
                          }}
                          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                </section>

                {/* Service Areas */}
                <section>
                  <h2 className="text-lg font-semibold mb-4">Service Areas</h2>
                  <div className="space-y-4">
                    <ServiceAreasPanel
                        serviceAreas={serviceAreas}
                        onRemove={removeServiceArea}
                        isEditing={true}
                    />
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={newServiceArea}
                            onChange={(e) => setNewServiceArea(e.target.value)}
                            placeholder="Add a service area"
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                      <button
                          type="button"
                          onClick={() => {
                            if (newServiceArea.trim()) {
                              addServiceArea(newServiceArea.trim());
                              setNewServiceArea('');
                            }
                          }}
                          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </section>

                {/* Certifications */}
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Certifications</h2>
                    <button
                        type="button"
                        onClick={() => setShowCertModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      {!hasReraCertificate ? 'Upload RERA Certificate' : 'Add Certification'}
                    </button>
                  </div>
                  <CertificationsPanel
                      certifications={certifications}
                      onRemove={removeCertification}
                      isEditing={true}
                  />
                </section>

                {/* Social Media Links */}
                <section>
                  <h2 className="text-lg font-semibold mb-4">Social Media Links</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        YouTube URL
                      </label>
                      <div className="relative">
                        <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="url"
                            value={formData.youtube || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, youtube: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="https://youtube.com/@username"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Facebook URL
                      </label>
                      <div className="relative">
                        <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="url"
                            value={formData.facebook || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="https://facebook.com/username"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instagram URL
                      </label>
                      <div className="relative">
                        <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="url"
                            value={formData.instagram || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="https://instagram.com/username"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        LinkedIn URL
                      </label>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="url"
                            value={formData.linkedin || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="https://linkedin.com/in/username"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        TikTok URL
                      </label>
                      <div className="relative">
                        <TikTok className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="url"
                            value={formData.tiktok || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, tiktok: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="https://tiktok.com/@username"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        X (Twitter) URL
                      </label>
                      <div className="relative">
                        <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="url"
                            value={formData.x || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, x: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="https://x.com/username"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Agency Information */}
                <section>
                  <h2 className="text-lg font-semibold mb-4">Agency Information</h2>

                  {linkedAgency && agencyDetails ? (
                      <AgencySection
                          agency={agencyDetails}
                          onRefresh={fetchData}
                      />
                  ) : isShowingAgencySearch ? (
                      <AgencySearchSection
                          onCancel={() => setIsShowingAgencySearch(false)}
                          onAgencySelected={fetchData}
                      />
                  ) : (
                      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <p className="mb-4 text-gray-600">
                          You can either add your agency information manually or connect with an existing agency.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <button
                              type="button"
                              onClick={handleShowAgencySearch}
                              className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 bg-gray-50"
                          >
                            <div className="text-center">
                              <Building2 className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                              <h3 className="text-lg font-medium text-gray-900 mb-1">Connect with Agency</h3>
                              <p className="text-sm text-gray-500">
                                Search for an existing agency and send a connection request
                              </p>
                            </div>
                          </button>

                          <div className="flex flex-col justify-between p-6 border-2 border-gray-300 rounded-lg bg-white">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 mb-3">Add Agency Manually</h3>
                              <p className="text-sm text-gray-500 mb-4">
                                Enter your agency details if you're not connecting with an existing one
                              </p>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Agency Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.agencyName || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, agencyName: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Agency Website
                                </label>
                                <input
                                    type="url"
                                    value={formData.agencyWebsite || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, agencyWebsite: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Agency Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.agencyEmail || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, agencyEmail: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Agency Logo
                                </label>
                                <div className="flex items-center space-x-4">
                                  {agencyLogoPreview ? (
                                      <img
                                          src={agencyLogoPreview}
                                          alt="Agency Logo"
                                          className="w-16 h-16 object-contain rounded"
                                      />
                                  ) : (
                                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                                        <Building2 className="h-8 w-8 text-gray-400" />
                                      </div>
                                  )}
                                  <label className="flex-1 cursor-pointer">
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp"
                                        onChange={handleAgencyLogoUpload}
                                        className="hidden"
                                        ref={logoInputRef}
                                    />
                                    <div className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-center">
                                      Upload Logo
                                    </div>
                                  </label>
                                </div>
                                <p className="mt-2 text-sm text-gray-500">
                                  Recommended: Square format, max 2MB
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Agency Formation Date
                            </label>
                            <input
                                type="date"
                                value={formData.agencyFormationDate || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, agencyFormationDate: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Agency Team Size
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={formData.agencyTeamSize || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, agencyTeamSize: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                  )}
                </section>
              </form>
            </div>
          </div>
        </div>

        {/* Certification Upload Modal */}
        <CertificationModal
            isOpen={showCertModal}
            onClose={() => setShowCertModal(false)}
            onUpload={handleCertificationUpload}
            isReraRequired={!hasReraCertificate}
        />
      </div>
  );
}

