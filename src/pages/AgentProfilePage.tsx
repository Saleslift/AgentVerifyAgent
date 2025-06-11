import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Import translation hook
import { useAgentProfile } from '../hooks/useAgentProfile';
import { useAgentProperties } from '../hooks/useAgentProperties';
import Header from '../components/Header';
import ServiceAreasPanel from '../components/ServiceAreasPanel';
import CertificationsPanel from '../components/CertificationsPanel';
import SocialMediaLinks from '../components/SocialMediaLinks';
import { Star, MessageSquare, Trash2 } from 'lucide-react';
import { Property, PropertyFilters } from '../types';
import { initPageVisibilityHandling, cleanupPageVisibilityHandling } from '../utils/pageVisibility';
import ShareModal from '../components/property/ShareModal';
import AgentHeroSection from '../components/agent/AgentHeroSection';
import AgentListingsTab from '../components/agent/AgentListingsTab';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import ConnectModal from '../components/agent/ConnectModal';
import AgentAgencyProfile from '../components/agent/AgentAgencyProfile';

export default function AgentProfilePage() {
  const { slug, lang } = useParams(); // Get language from URL
  const navigate = useNavigate();
  const { i18n, t } = useTranslation(); // Initialize translation hook
  const { user } = useAuth();
  const { agent, loading, error } = useAgentProfile(slug);
  const { properties, loading: propertiesLoading, error: propertiesError } = useAgentProperties(agent?.id);
  const [activeTab, setActiveTab] = useState<'listings' | 'about' | 'reviews'>('listings');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const listingsSectionRef = useRef<HTMLDivElement>(null);

  // Search filters state
  const [searchFilters, setSearchFilters] = useState<PropertyFilters>({
    // No location filter by default
  });

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    name: '',
    email: '',
    whatsapp: '',
    rating: 0,
    comment: ''
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Reply form state
  const [replyForm, setReplyForm] = useState({
    reviewId: '',
    reply: ''
  });
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [showReplyForm, setShowReplyForm] = useState<string | null>(null);

  // Initialize page visibility handling to prevent reloads
  useEffect(() => {
    initPageVisibilityHandling();
    return () => cleanupPageVisibilityHandling();
  }, []);

  // Calculate average rating
  const averageRating = useMemo(() => {
    if (!agent?.reviews?.length) return 0;
    const total = agent.reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / agent.reviews.length;
  }, [agent?.reviews]);


  const handleCopySuccess = () => {
    setShowCopiedMessage(true);
    setTimeout(() => setShowCopiedMessage(false), 2000);
  };


  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setReviewSubmitting(true);
      setReviewError(null);

      // Validate form
      if (!reviewForm.name.trim()) {
        throw new Error(t('enterName'));
      }
      if (!reviewForm.email.trim()) {
        throw new Error(t('enterEmail'));
      }
      if (!reviewForm.whatsapp.trim()) {
        throw new Error(t('enterWhatsApp'));
      }
      if (reviewForm.rating === 0) {
        throw new Error(t('selectRating'));
      }
      if (!reviewForm.comment.trim()) {
        throw new Error(t('enterReview'));
      }

      // Submit review to Supabase
      const { error } = await supabase
        .from('reviews')
        .insert({
          agent_id: agent?.id,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
          reviewer_contact: {
            email: reviewForm.email,
            whatsapp: reviewForm.whatsapp,
            name: reviewForm.name
          }
        });

      if (error) throw error;

      // Reset form and show success message
      setReviewForm({
        name: '',
        email: '',
        whatsapp: '',
        rating: 0,
        comment: ''
      });
      setReviewSuccess(true);
      setTimeout(() => {
        setReviewSuccess(false);
        setShowReviewForm(false);
      }, 3000);

    } catch (err) {
      console.error(t('errorSubmittingReview'), err);
      setReviewError(err instanceof Error ? err.message : t('failedSubmitReview'));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setReplySubmitting(true);
      setReplyError(null);

      // Validate form
      if (!replyForm.reply.trim()) {
        throw new Error(t('enterReply'));
      }

      // Submit reply to Supabase
      const { error } = await supabase
        .from('reviews')
        .update({
          agent_reply: replyForm.reply
        })
        .eq('id', replyForm.reviewId);

      if (error) throw error;

      // Reset form and close reply form
      setReplyForm({
        reviewId: '',
        reply: ''
      });
      setShowReplyForm(null);

    } catch (err) {
      console.error(t('errorSubmittingReply'), err);
      setReplyError(err instanceof Error ? err.message : t('failedSubmitReply'));
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm(t('confirmDeleteReview'))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

    } catch (err) {
      console.error(t('errorDeletingReview'), err);
      alert(t('failedDeleteReview'));
    }
  };

  // Check if current user is the agent
  const isCurrentAgent = user?.id === agent?.id;

  // Set language based on URL or default to English
  useEffect(() => {
    if (lang === 'fr') {
      i18n.changeLanguage('fr');
    } else {
      i18n.changeLanguage('en');
    }
  }, [lang, i18n]);

  // Redirect to default language if none is provided
  useEffect(() => {
    if (!lang) {
      navigate(`/agent/${slug}/en`, { replace: true });
    }
  }, [lang, slug, navigate]);

  if (loading || propertiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error || propertiesError || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('error')}</h2>
          <p className="text-gray-600">{error || propertiesError || t('agentNotFound')}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
          >
            {t('returnHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative z-[1]">
      <Header agent={agent} />

      {/* Hero Section */}
      <AgentHeroSection agent={agent} averageRating={averageRating} />


      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12" id="listings-section">
        {/* Navigation Tabs */}
        <div className="flex justify-center border-b border-gray-200 mb-8 md:mb-12 overflow-x-auto">

          <button
            data-tab="listings"
            className={`px-4 sm:px-8 py-4 text-lg font-medium border-b-2 whitespace-nowrap transition-colors duration-200 ${
              activeTab === 'listings'
                ? 'border-primary-300 text-primary-300'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('listings')}
          >
            {t('listings')}
          </button>
          <button
            data-tab="reviews"
            className={`px-4 sm:px-8 py-4 text-lg font-medium border-b-2 whitespace-nowrap transition-colors duration-200 ${
              activeTab === 'reviews'
                ? 'border-primary-300 text-primary-300'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('reviews')}
          >
            {t('reviews')}
          </button>
          <button
              data-tab="about"
              className={`px-4 sm:px-8 py-4 text-lg font-medium border-b-2 whitespace-nowrap transition-colors duration-200 ${
                  activeTab === 'about'
                      ? 'border-primary-300 text-primary-300'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('about')}
          >
            {t('about')}
          </button>
        </div>

        {/* Listings Tab */}
        {activeTab === 'listings' && (
          <div ref={listingsSectionRef}>
            <AgentListingsTab
              properties={properties}
              loading={propertiesLoading}
              error={propertiesError}
              initialFilters={searchFilters}
            />
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* About Me Section */}
                {/* Social Media Links */}
                {(agent.youtube || agent.facebook || agent.instagram || agent.linkedin || agent.tiktok || agent.x) && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
                      <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('aboutMe')}</h2>
                      <p className="text-gray-600 leading-relaxed text-base md:text-lg">{agent.bio}</p>

                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <h3 className="text-lg font-semibold mb-4">{t('connectWithMe')}</h3>
                        <SocialMediaLinks
                            youtube={agent.youtube}
                            facebook={agent.facebook}
                            instagram={agent.instagram}
                            linkedin={agent.linkedin}
                            tiktok={agent.tiktok}
                            x={agent.x}
                        />
                      </div>
                    </div>
                )}


              {/* Agency Information Section */}
              <AgentAgencyProfile agent={agent} />
            </div>


            <div className="space-y-8">
              {/* Service Areas */}
              {agent.serviceAreas && agent.serviceAreas.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold mb-6">{t('serviceAreas')}</h3>
                  <ServiceAreasPanel serviceAreas={agent.serviceAreas} />
                </div>
              )}

              {/* Certifications */}
              {agent.certifications && agent.certifications.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold mb-6">{t('certifications')}</h3>
                  <CertificationsPanel certifications={agent.certifications} />
                </div>
              )}

              {/* Languages */}
              {agent.languages && agent.languages.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold mb-6">{t('languages')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {agent.languages.map(language => (
                      <span
                        key={language}
                        className="px-3 py-1 bg-gray-100 rounded-full text-gray-800"
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Specialties */}
              {agent.specialties && agent.specialties.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold mb-6">{t('specialties')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {agent.specialties.map(specialty => (
                      <span
                        key={specialty}
                        className="px-3 py-1 bg-gray-100 rounded-full text-gray-800"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-8">
            {/* Add Review Button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                {showReviewForm ? t('cancelReview') : t('addReview')}
              </button>
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                <h3 className="text-xl font-bold mb-4">{t('writeReview')}</h3>

                {reviewSuccess && (
                  <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
                    {t('reviewSubmitted')}
                  </div>
                )}

                {reviewError && (
                  <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                    {reviewError}
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleReviewSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('yourName')} *
                    </label>
                    <input
                      type="text"
                      value={reviewForm.name}
                      onChange={(e) => setReviewForm({...reviewForm, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                      placeholder={t('enterNamePlaceholder')}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('emailAddress')} *
                      </label>
                      <input
                        type="email"
                        value={reviewForm.email}
                        onChange={(e) => setReviewForm({...reviewForm, email: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                        placeholder={t('emailPlaceholder')}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('whatsappNumber')} *
                      </label>
                      <input
                        type="tel"
                        value={reviewForm.whatsapp}
                        onChange={(e) => setReviewForm({...reviewForm, whatsapp: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                        placeholder={t('whatsappPlaceholder')}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('rating')} *
                    </label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm({...reviewForm, rating: star})}
                          className="text-2xl"
                        >
                          <Star
                            className={`h-8 w-8 ${
                              reviewForm.rating >= star 
                                ? 'text-[#cefa05] fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('yourReview')} *
                    </label>
                    <textarea
                      rows={4}
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                      placeholder={t('reviewPlaceholder')}
                      required
                    ></textarea>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50"
                    >
                      {reviewSubmitting ? t('submitting') : t('submitReview')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-6">
              {agent.reviews && agent.reviews.length > 0 ? (
                agent.reviews.map(review => (
                  <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                      <div className="mb-4 md:mb-0">
                        <h3 className="text-xl font-bold text-gray-900">
                          {review.reviewer?.full_name ||
                           (review.reviewer_contact && review.reviewer_contact.name) ||
                           t('anonymous')}
                        </h3>
                        <span className="text-gray-500 text-sm">{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex text-[#cefa05]">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-6 w-6 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-lg mb-6">{review.comment}</p>

                    {review.agent_reply && (
                      <div className="mt-6 pl-6 border-l-4 border-primary-300 bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <p className="text-gray-600 italic text-lg">{review.agent_reply}</p>
                        <p className="text-sm font-medium mt-3">- {agent.name}</p>
                      </div>
                    )}

                    {/* Reply and Delete options for the agent */}
                    {isCurrentAgent && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {!review.agent_reply && (
                          <button
                            onClick={() => {
                              setShowReplyForm(review.id);
                              setReplyForm({
                                reviewId: review.id,
                                reply: ''
                              });
                            }}
                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
                          >
                            <MessageSquare className="h-4 w-4 inline mr-2" />
                            {t('reply')}
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4 inline mr-2" />
                          {t('delete')}
                        </button>
                      </div>
                    )}

                    {/* Reply Form */}
                    {showReplyForm === review.id && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="font-medium mb-2">{t('replyToReview')}</h4>

                        {replyError && (
                          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
                            {replyError}
                          </div>
                        )}

                        <form onSubmit={handleReplySubmit}>
                          <textarea
                            rows={3}
                            value={replyForm.reply}
                            onChange={(e) => setReplyForm({...replyForm, reply: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-transparent mb-3"
                            placeholder={t('replyPlaceholder')}
                            required
                          ></textarea>

                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => setShowReplyForm(null)}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                              {t('cancel')}
                            </button>
                            <button
                              type="submit"
                              disabled={replySubmitting}
                              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50"
                            >
                              {replySubmitting ? t('submitting') : t('submitReply')}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <p className="text-gray-500">{t('noReviews', { agentName: agent.name })}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {selectedProperty && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          property={selectedProperty}
          onCopySuccess={handleCopySuccess}
        />
      )}

      {/* Connect Modal */}
      <ConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        agent={agent}
      />
    </div>
  );
}
